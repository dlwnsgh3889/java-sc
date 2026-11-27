window.CampusFeatures = window.CampusFeatures || {};

// 1. 교수님 랭킹 데이터 — 서버(server.js)의 data/professors.json 파일에 저장되어 모든 사용자가 공유
//    명단·별점·의견을 바꾸려면 data/professors.json 을 수정하세요.
const PROFESSOR_API = '/api/professors';
const RANKING_REFRESH_MS = 20000; // 다른 사람이 남긴 평가를 20초마다 반영

let professorStoreByDept = {};
let rankingServerOnline = false;

// 2. 서버에서 랭킹 데이터 불러오기
async function fetchProfessorStore() {
  try {
    const res = await fetch(PROFESSOR_API, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const serverData = await res.json();
    // 시간표에서 추가한 교수님(아직 평가 전)은 화면에만 있으므로 유지
    Object.entries(professorStoreByDept).forEach(([dept, store]) => {
      if (!serverData[dept]) return;
      store.professors
        .filter((p) => p.id.startsWith('custom-') && !serverData[dept].professors.some((sp) => sp.id === p.id))
        .forEach((p) => serverData[dept].professors.push(p));
    });
    professorStoreByDept = serverData;
    rankingServerOnline = true;
  } catch (e) {
    console.warn('랭킹 서버에 연결하지 못했습니다:', e);
    rankingServerOnline = false;
  }
  renderProfessorRanking();
}

// 3. 서버로 평가 1건 보내기
async function postProfessorRating(payload) {
  const res = await fetch(`${PROFESSOR_API}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || '저장에 실패했습니다.');
  professorStoreByDept[body.dept] = body.store;
}

let activeProfDept = '스마트소프트웨어학과';

const escapeRankingText = (text) =>
  String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// 현재 학년 시간표(기본 + 내가 추가한 수업)에 있는 교수님만 골라내기
// - 시간표에 교수님이 없으면: 자유전공학과는 빈 목록, 그 외 학과는 학과 교수님 전체
let visibleProfessors = [];
function getVisibleProfessors(store) {
  const profile = window.CampusFeatures.getScheduleProfile?.();
  const gradeProfs = profile && profile.dept === activeProfDept ? window.CampusFeatures.getGradeProfessors?.() : null;
  if (!gradeProfs) return { list: store.professors, scoped: false };
  if (gradeProfs.length === 0) {
    return activeProfDept === '자유전공학과' ? { list: [], scoped: true } : { list: store.professors, scoped: false };
  }

  const list = gradeProfs.map(({ name, subjects }) => {
    const fullName = `${name} 교수님`;
    let prof = store.professors.find((p) => p.name === fullName);
    if (!prof) {
      // 시간표에 새로 등장한 교수님은 화면에 먼저 추가 (첫 평가 때 서버 명단에 등록됨)
      prof = { id: `custom-${name}`, name: fullName, subject: subjects.join(', '), rating: 0, votes: 0 };
      store.professors.push(prof);
    }
    return { ...prof, subject: subjects.join(', ') };
  });
  return { list, scoped: true };
}

// 3. 학과별 교수님 랭킹 및 최근 의견 화면 렌더링
function renderProfessorRanking(deptName = activeProfDept) {
  if (deptName) activeProfDept = deptName;
  // 서버 데이터가 아직 없거나 연결 실패 시 빈 목록으로 표시
  const store = professorStoreByDept[activeProfDept] || { professors: [], reviews: [] };
  professorStoreByDept[activeProfDept] = store;

  const { list: visibleList, scoped } = getVisibleProfessors(store);
  visibleProfessors = visibleList;
  const visibleNames = new Set(visibleList.map((p) => p.name));
  const reviews = scoped ? store.reviews.filter((rev) => visibleNames.has(rev.profName)) : store.reviews;
  const profile = window.CampusFeatures.getScheduleProfile?.();

  document.querySelectorAll('.dept-title-text').forEach((el) => {
    el.textContent = scoped && profile ? `${activeProfDept} ${window.CampusData.gradeText(profile.grade)}` : activeProfDept;
  });

  const emptyMessage = rankingServerOnline
    ? '시간표에 교수님 성함과 함께 수업을 추가하면 평가할 수 있어요.'
    : '랭킹 서버에 연결되지 않았어요. 터미널에서 node server.js 실행 후 http://localhost:3000 으로 접속해 주세요.';
  const emptyHTML = `<li style="color:var(--muted); justify-content:center; padding:14px 0;">${emptyMessage}</li>`;

  // 평균 별점 높은 순 (동점 시 투표수 많은 순)
  const sorted = [...visibleList].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.votes - a.votes;
  });

  const buildRankingHTML = (list) =>
    list
      .map((item, idx) => {
        const rank = idx + 1;
        const medalClass = rank <= 3 ? `rank-${rank}` : '';
        return `
          <li class="prof-rank-item">
            <div class="prof-rank-left">
              <span class="rank-medal ${medalClass}">${rank}</span>
              <div class="prof-info">
                <span class="prof-name">${escapeRankingText(item.name)}</span>
                <span class="prof-subject">${escapeRankingText(item.subject)}</span>
              </div>
            </div>
            <span class="prof-score">${item.votes ? `★ ${item.rating.toFixed(1)} (${item.votes}표)` : '아직 평가 없음'}</span>
          </li>
        `;
      })
      .join('') || emptyHTML;

  // 메인 화면 인기 교수님 랭킹 (TOP 3) + 최신 의견 1건 (.at(0)으로 첫 번째 리뷰 안전 추출)
  const mainListEl = document.querySelector('#professorRankingList');
  if (mainListEl) {
    const latestReview = reviews.at(0);
    const latestReviewHTML = latestReview
      ? `<li style="background:#f8fbfe; border-radius:8px; padding:10px 12px; margin-top:8px; border-bottom:0; display:block;">
           <div style="font-size:0.78rem; color:var(--blue); font-weight:700; margin-bottom:2px;">
             💬 최신 의견 · ${escapeRankingText(latestReview.profName)} (${'★'.repeat(latestReview.star)})
           </div>
           <div style="font-size:0.84rem; color:var(--ink);">"${escapeRankingText(latestReview.comment)}"</div>
         </li>`
      : '';

    mainListEl.innerHTML = buildRankingHTML(sorted.slice(0, 3)) + latestReviewHTML;
  }

  // 교수랭킹 탭 실시간 랭킹 (TOP 3)
  const profListEl = document.querySelector('#etcProfessorRankingList');
  if (profListEl) {
    profListEl.innerHTML = buildRankingHTML(sorted.slice(0, 3));
  }

  // 교수님 선택 드롭다운 (현재 학년에서 보이는 교수님만)
  const profSelectEl = document.querySelector('#ratingProfSelect');
  if (profSelectEl) {
    const prevSelected = profSelectEl.value;
    profSelectEl.innerHTML = visibleList.length
      ? visibleList
          .map((p) => `<option value="${escapeRankingText(p.id)}">${escapeRankingText(p.name)} (${escapeRankingText(p.subject)})</option>`)
          .join('')
      : '<option value="">평가할 교수님이 없어요</option>';
    if (prevSelected && visibleList.some((p) => p.id === prevSelected)) {
      profSelectEl.value = prevSelected;
    }
  }

  // 최근 한줄 의견 목록
  const reviewListEl = document.querySelector('#profReviewList');
  if (reviewListEl) {
    reviewListEl.innerHTML = reviews
      .map((rev) => {
        const stars = '★'.repeat(rev.star) + '☆'.repeat(5 - rev.star);
        return `
          <li class="review-item">
            <div class="review-top">
              <strong>${escapeRankingText(rev.profName)} <span class="muted">· ${escapeRankingText(rev.subject)}</span></strong>
              <span class="review-stars">${stars}</span>
            </div>
            <p class="review-text">${escapeRankingText(rev.comment)}</p>
          </li>
        `;
      })
      .join('');
  }
}

// 4. 별점 선택 및 의견 제출 이벤트 초기화
function initializeProfessorRanking() {
  const starButtons = document.querySelectorAll('#starPicker .star-btn');
  const starInput = document.getElementById('ratingStarValue');
  const starLabel = document.getElementById('starScoreLabel');
  const ratingForm = document.getElementById('profRatingForm');

  starButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedStar = Number(btn.dataset.star);
      if (starInput) starInput.value = selectedStar;
      if (starLabel) starLabel.textContent = `${selectedStar.toFixed(1)}점`;
      starButtons.forEach((sBtn) => sBtn.classList.toggle('active', Number(sBtn.dataset.star) <= selectedStar));
    });
  });

  if (ratingForm) {
    ratingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const profId = document.getElementById('ratingProfSelect').value;
      const star = Number(document.getElementById('ratingStarValue').value || 5);
      const commentInput = document.getElementById('ratingCommentInput');
      const comment = commentInput.value.trim();
      if (!comment) return;

      const targetProf = visibleProfessors.find((p) => p.id === profId);
      if (!targetProf) {
        alert('평가할 교수님을 먼저 선택해 주세요. 시간표에 수업을 추가하면 교수님이 나타나요.');
        return;
      }

      const submitBtn = ratingForm.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        // 화면에 보이는 과목명(시간표 기준)과 함께 서버에 저장
        await postProfessorRating({
          dept: activeProfDept,
          profId,
          profName: targetProf.name,
          subject: targetProf.subject,
          star,
          comment
        });
        renderProfessorRanking(activeProfDept);

        commentInput.value = '';
        if (starInput) starInput.value = '5';
        if (starLabel) starLabel.textContent = '5.0점';
        starButtons.forEach((sBtn) => sBtn.classList.add('active'));

        alert('⭐ 별점과 의견이 저장되었어요! 다른 사람들도 이 평가를 볼 수 있어요.');
      } catch (err) {
        alert(`저장하지 못했어요: ${err.message}\n서버(node server.js)가 실행 중인지 확인해 주세요.`);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  renderProfessorRanking('스마트소프트웨어학과');
  fetchProfessorStore();
  setInterval(fetchProfessorStore, RANKING_REFRESH_MS);
}

// 5. FAQ 아코디언 및 기타 건의사항 폼 초기화
function initializeFaq() {
  document.querySelectorAll('.faq-q').forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      if (answer) answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
    });
  });
}

function initializeFeedback() {
  const feedbackForm = document.querySelector('#feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('의견이 저장되었습니다. 감사합니다!');
      event.currentTarget.reset();
    });
  }
}

window.CampusFeatures.initializeProfessorRanking = initializeProfessorRanking;
window.CampusFeatures.renderProfessorRanking = renderProfessorRanking;
window.CampusFeatures.initializeFaq = initializeFaq;
window.CampusFeatures.initializeFeedback = initializeFeedback;
