// 캠퍼스 라이프 어시스턴트 서버
// - 사이트 파일(html/css/js)을 그대로 보여주고
// - 교수님 랭킹(별점·한줄 의견)을 SQLite 데이터베이스(data/campus.db)에 저장해 모든 사용자가 공유합니다.
// - 교수님 명단은 data/professors.json 에서 관리하며, 서버를 켤 때 DB에 반영됩니다.
// 실행: node server.js  →  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // 같은 와이파이의 다른 사람도 접속 가능
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'data', 'campus.db');
const PROFESSOR_LIST_FILE = path.join(ROOT, 'data', 'professors.json');
const START_PAGE = '/복사본.html';
const REVIEWS_PER_DEPT = 100; // 화면에 보내는 학과별 최근 의견 수

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ---------- SQLite 데이터베이스 ----------
const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS professors (
    dept        TEXT    NOT NULL,              -- 학과
    id          TEXT    NOT NULL,              -- 교수님 id (예: sw1, custom-이승익)
    name        TEXT    NOT NULL,              -- 이름 (예: 이승익 교수님)
    subject     TEXT    NOT NULL DEFAULT '',   -- 관심분야/담당과목
    star_total  INTEGER NOT NULL DEFAULT 0,    -- 받은 별점 합계
    votes       INTEGER NOT NULL DEFAULT 0,    -- 평가 수
    PRIMARY KEY (dept, id)
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    dept        TEXT    NOT NULL,
    prof_id     TEXT    NOT NULL,
    prof_name   TEXT    NOT NULL,
    subject     TEXT    NOT NULL DEFAULT '',
    star        INTEGER NOT NULL CHECK (star BETWEEN 1 AND 5),
    comment     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_dept ON reviews (dept, id DESC);
`);

// professors.json 명단을 DB에 반영 (새 교수님 추가, 이름·분야 수정 / 기존 평가는 유지)
function syncProfessorList() {
  const list = JSON.parse(fs.readFileSync(PROFESSOR_LIST_FILE, 'utf8'));
  const upsert = db.prepare(`
    INSERT INTO professors (dept, id, name, subject) VALUES (?, ?, ?, ?)
    ON CONFLICT (dept, id) DO UPDATE SET name = excluded.name, subject = excluded.subject
  `);
  db.exec('BEGIN');
  try {
    Object.entries(list).forEach(([dept, { professors }]) => {
      professors.forEach((p) => upsert.run(dept, p.id, p.name, p.subject || ''));
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return Object.keys(list);
}

const DEPARTMENTS = new Set(syncProfessorList());

const selectProfessors = db.prepare('SELECT id, name, subject, star_total, votes FROM professors WHERE dept = ? ORDER BY rowid');
const selectReviews = db.prepare(
  'SELECT prof_name, subject, star, comment, created_at FROM reviews WHERE dept = ? ORDER BY id DESC LIMIT ?'
);

// 학과 하나의 랭킹 데이터 (화면에서 쓰는 형태로 변환)
function getDeptStore(dept) {
  return {
    professors: selectProfessors.all(dept).map((p) => ({
      id: p.id,
      name: p.name,
      subject: p.subject,
      rating: p.votes ? Math.round((p.star_total / p.votes) * 10) / 10 : 0,
      votes: p.votes
    })),
    reviews: selectReviews.all(dept, REVIEWS_PER_DEPT).map((r) => ({
      profName: r.prof_name,
      subject: r.subject,
      star: r.star,
      comment: r.comment,
      createdAt: r.created_at
    }))
  };
}

function getAllStores() {
  const result = {};
  DEPARTMENTS.forEach((dept) => {
    result[dept] = getDeptStore(dept);
  });
  return result;
}

const findProfessor = db.prepare('SELECT id, name, subject FROM professors WHERE dept = ? AND id = ?');
const insertProfessor = db.prepare('INSERT INTO professors (dept, id, name, subject) VALUES (?, ?, ?, ?)');
const addVote = db.prepare('UPDATE professors SET star_total = star_total + ?, votes = votes + 1 WHERE dept = ? AND id = ?');
const insertReview = db.prepare(
  'INSERT INTO reviews (dept, prof_id, prof_name, subject, star, comment) VALUES (?, ?, ?, ?, ?, ?)'
);

// 평가 1건 저장 (교수님 별점 갱신 + 의견 추가를 한 번에 처리)
function saveRating({ dept, profId, profName, subject, star, comment }) {
  db.exec('BEGIN');
  try {
    let prof = findProfessor.get(dept, profId);
    if (!prof) {
      // 시간표에서 직접 추가한 교수님(custom-이름)은 처음 평가될 때 명단에 등록
      insertProfessor.run(dept, profId, profName, subject);
      prof = { id: profId, name: profName, subject };
    }
    addVote.run(star, dept, profId);
    insertReview.run(dept, profId, prof.name, subject || prof.subject, star, comment);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- 응답 도우미 ----------
function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error('요청이 너무 큽니다.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const cleanText = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength);

// ---------- API ----------
// GET  /api/professors        → 전체 학과 랭킹 데이터
// POST /api/professors/rate   → { dept, profId, profName, subject, star, comment } 평가 1건 저장
async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/professors') {
    return sendJSON(res, 200, getAllStores());
  }

  if (req.method === 'POST' && pathname === '/api/professors/rate') {
    let input;
    try {
      input = JSON.parse(await readBody(req));
    } catch {
      return sendJSON(res, 400, { error: '잘못된 요청 형식입니다.' });
    }

    const dept = cleanText(input.dept, 30);
    const profId = cleanText(input.profId, 40);
    const profName = cleanText(input.profName, 25);
    const subject = cleanText(input.subject, 80);
    const comment = cleanText(input.comment, 200);
    const star = Number(input.star);

    if (!Number.isInteger(star) || star < 1 || star > 5) return sendJSON(res, 400, { error: '별점은 1~5점이어야 합니다.' });
    if (!comment) return sendJSON(res, 400, { error: '한줄 의견을 입력해 주세요.' });

    if (!DEPARTMENTS.has(dept)) return sendJSON(res, 400, { error: '없는 학과입니다.' });
    if (!findProfessor.get(dept, profId) && (!profId.startsWith('custom-') || !profName)) {
      return sendJSON(res, 400, { error: '없는 교수님입니다.' });
    }

    saveRating({ dept, profId, profName, subject, star, comment });
    return sendJSON(res, 200, { dept, store: getDeptStore(dept) });
  }

  return sendJSON(res, 404, { error: '없는 API입니다.' });
}

// ---------- 정적 파일 ----------
function serveStatic(res, pathname) {
  if (pathname === '/') pathname = START_PAGE;
  const filePath = path.normalize(path.join(ROOT, pathname));
  const relative = path.relative(ROOT, filePath);
  // 폴더 밖 접근·숨김 파일(.git 등)·데이터 폴더(DB 파일)·서버 코드 차단
  const parts = relative.split(path.sep);
  if (
    relative.startsWith('..') ||
    path.isAbsolute(relative) ||
    parts.some((part) => part.startsWith('.')) ||
    parts[0].toLowerCase() === 'data' ||
    relative === 'server.js'
  ) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('파일을 찾을 수 없습니다.');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad Request');
  }

  try {
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    return serveStatic(res, pathname);
  } catch (err) {
    console.error(err);
    return sendJSON(res, 500, { error: '서버 오류가 발생했습니다.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .forEach((net) => console.log(`같은 와이파이에서 접속: http://${net.address}:${PORT}`));
  console.log(`랭킹 데이터베이스: ${DB_FILE}`);
  console.log(`교수님 명단 파일: ${PROFESSOR_LIST_FILE}`);
});
