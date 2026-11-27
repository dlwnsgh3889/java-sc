window.CampusFeatures = window.CampusFeatures || {};

// 날짜 기반 구조로 업그레이드되면서 저장소 키를 v2로 변경
const ASSIGNMENT_STORAGE_KEY = 'campusAssignmentsData_v2';
let currentClass = 'A';
let currentDept = '스마트소프트웨어학과';
let currentGrade = '1';

// 오늘 날짜의 자정(00:00:00) Date 객체 반환
function getTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 오늘로부터 N일 뒤 날짜 문자열('YYYY-MM-DD') 생성
function getFutureDateString(daysFromToday) {
  const target = getTodayStart();
  target.setDate(target.getDate() + daysFromToday);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 마감일('YYYY-MM-DD')과 오늘 날짜의 차이(일수) 계산
function getDiffDays(dueDateStr) {
  const parts = String(dueDateStr).split('-');
  if (parts.length !== 3) return 0;
  const due = new Date(Number(parts.at(0)), Number(parts.at(1)) - 1, Number(parts.at(2)));
  const today = getTodayStart();
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

// 1. localStorage에서 반별 과제 불러오기 + 기한 지난 과제 자동 삭제
function loadAssignmentsStore() {
  let store = null;
  try {
    localStorage.removeItem('campusAssignmentsData_v1'); // 구버전 데이터 정리
    const saved = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    if (saved) store = JSON.parse(saved);
  } catch (e) {
    console.warn('과제 데이터 로드 실패:', e);
  }

  // 저장된 데이터가 없으면 data.js의 초기 데이터를 실제 마감 날짜로 변환하여 생성
  if (!store) {
    const convertInitial = (arr) =>
      (arr || []).map((item) => {
        const title = item.at(0);
        const dayStr = String(item.at(1) || 'D-3');
        const match = dayStr.match(/(\d+)/);
        const days = match ? Number(match.at(1)) : 3;
        return { title, dueDate: getFutureDateString(days) };
      });

    store = {
      A: convertInitial(window.CampusData?.classData?.A?.assignments),
      B: convertInitial(window.CampusData?.classData?.B?.assignments)
    };
  }

  // 기한이 지난 과제(diffDays < 0) 자동 필터링 삭제 & 임박한 순 정렬
  let hasExpired = false;
  ['A', 'B'].forEach((cls) => {
    const list = store[cls] || [];
    const validList = list
      .filter((item) => {
        const valid = getDiffDays(item.dueDate) >= 0;
        if (!valid) hasExpired = true;
        return valid;
      })
      .sort((a, b) => getDiffDays(a.dueDate) - getDiffDays(b.dueDate));
    store[cls] = validList;
  });

  if (hasExpired) saveAssignmentsStore(store);
  return store;
}

function saveAssignmentsStore(store) {
  try {
    localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('과제 데이터 저장 실패:', e);
  }
}

let assignmentsStore = loadAssignmentsStore();

// 남은 일수에 따른 배지 텍스트 및 색상 반환
function getBadgeInfo(diffDays) {
  if (diffDays === 0) return { text: 'D-Day', color: '#ef4444' };
  if (diffDays <= 3) return { text: `D-${diffDays}`, color: '#ef4444' };
  if (diffDays <= 7) return { text: `D-${diffDays}`, color: '#f59e0b' };
  return { text: `D-${diffDays}`, color: '#2563eb' };
}

// 2. 주간 시간표 테이블 HTML 생성
function buildWeeklyTimetable(rows, spans, cells = {}, editable = false) {
  const covered = new Set();
  let html = '';
  rows.forEach((row, rowIndex) => {
    html += '<tr>';
    row.forEach((cell, colIndex) => {
      if (colIndex === 0) {
        html += `<td>${cell}</td>`;
        return;
      }
      const key = `${rowIndex}-${colIndex}`;
      if (covered.has(key)) return;
      const span = spans.hasOwnProperty(key) ? spans[key] : 1;
      for (let index = 1; index < span; index += 1) {
        covered.add(`${rowIndex + index}-${colIndex}`);
      }
      const info = cells[key];
      const profLine = info?.prof ? `<small class="course-prof">${escapeHTML(info.prof)}</small>` : '';
      // 수업 칸: 누르면 삭제 / 빈 칸: 누르면 추가 폼에 요일·시간 자동 입력
      // 수정 모드일 때만 클릭 가능
      let dataAttr = '';
      if (editable) {
        dataAttr = info
          ? `data-course-idx="${info.idx}" title="눌러서 삭제"`
          : `data-slot-day="${colIndex}" data-slot-hour="${rowIndex + 9}" title="눌러서 이 시간에 수업 추가"`;
      }
      html += `<td ${span > 1 ? `rowspan="${span}"` : ''} class="${cell ? 'course' : 'empty-slot'}" ${dataAttr}>${cell}${profLine}</td>`;
    });
    html += '</tr>';
  });
  return `<thead><tr><th>시간</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th></tr></thead><tbody>${html}</tbody>`;
}

// 3. 테이블형 오늘의 시간표 HTML 생성
function buildTodayTimetable(rows, spans) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayIndex = new Date().getDay();
  const todayName = days.at(todayIndex);

  if (todayIndex === 0 || todayIndex === 6) {
    return `<tbody><tr><td colspan="2" style="padding: 20px; color: var(--muted);">오늘은 수업이 없는 주말(${todayName}요일)입니다. 🎉</td></tr></tbody>`;
  }

  let html = '';
  let skipCount = 0;

  rows.forEach((row, rowIndex) => {
    const time = row.at(0);
    if (skipCount > 0) {
      skipCount -= 1;
      return;
    }

    const course = row.at(todayIndex);
    const key = `${rowIndex}-${todayIndex}`;
    const span = spans.hasOwnProperty(key) ? spans[key] : 1;
    if (span > 1) skipCount = span - 1;

    const startHour = parseInt(time.split(':').at(0), 10);
    const endHour = String(startHour + span).padStart(2, '0') + ':00';
    const timeRange = span > 1 ? `${time} ~ ${endHour}` : time;

    html += `<tr><td style="width: 35%;">${timeRange}</td><td class="${course ? 'course' : ''}">${course || '-'}</td></tr>`;
  });

  return `<thead><tr><th>시간</th><th>오늘 (${todayName}요일)</th></tr></thead><tbody>${html}</tbody>`;
}

// 4. 메인 화면 가로 칩 형태의 오늘의 시간표 렌더링
function renderTodayHorizontal(className, data) {
  if (!data) return;

  document.querySelectorAll('.class-title-text').forEach((el) => {
    el.textContent = `${className}반`;
  });

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayIndex = new Date().getDay();
  const todayName = days.at(todayIndex);
  const container = document.querySelector('#todayTimetable');
  const dayBadge = document.querySelector('#todayDayBadge');

  if (dayBadge) dayBadge.textContent = `(${todayName}요일)`;
  if (!container) return;

  if (todayIndex === 0 || todayIndex === 6) {
    container.innerHTML = `<div class="today-empty">오늘은 수업이 없는 주말(${todayName}요일)입니다. 🎉</div>`;
    return;
  }

  let html = '';
  data.rows.forEach((row) => {
    const time = row.at(0);
    const course = row.at(todayIndex);
    if (course) {
      const hour24 = parseInt(time.split(':').at(0), 10);
      const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
      html += `<div class="today-course-chip"><span class="today-course-time">${hour12}시</span><span>${course}</span></div>`;
    }
  });
  container.innerHTML = html || `<div class="today-empty">오늘은 예정된 수업이 없습니다. 😊</div>`;
}

// 5. 과제 목록 및 날짜 기반 편집 컨트롤 렌더링
function renderAssignments(className) {
  const assignmentListEl = document.querySelector('#assignmentList');
  if (!assignmentListEl) return;

  // 렌더링 시점에도 기간이 지난 항목 자동 제거 및 정렬
  const rawList = assignmentsStore[className] || [];
  const validList = rawList
    .filter((item) => getDiffDays(item.dueDate) >= 0)
    .sort((a, b) => getDiffDays(a.dueDate) - getDiffDays(b.dueDate));

  if (validList.length !== rawList.length) {
    assignmentsStore[className] = validList;
    saveAssignmentsStore(assignmentsStore);
  }

  const activeTabBtn = document.querySelector('#bottomNav button.active');
  const isAssignmentTab = activeTabBtn?.dataset.target === 'assignment';

  if (validList.length === 0) {
    assignmentListEl.innerHTML = `<li style="color:var(--muted); justify-content:center; padding:18px 0;">남은 과제가 없습니다. 아래에서 새 과제를 등록해 보세요!</li>`;
  } else {
    assignmentListEl.innerHTML = validList
      .map((item, idx) => {
        const diff = getDiffDays(item.dueDate);
        const badge = getBadgeInfo(diff);

        // 과제 탭에서는 실제 마감 날짜(예: ~11/30)와 수정·삭제 버튼을 함께 표시
        const dueDateSub = isAssignmentTab
          ? `<span style="font-size:0.78rem; color:var(--muted); margin-left:6px;">(~${item.dueDate.slice(5).replace('-', '/')})</span>`
          : '';

        const actionButtons = isAssignmentTab
          ? `<span style="display:inline-flex; gap:4px; margin-left:8px;">
               <button type="button" class="assign-edit-btn" data-idx="${idx}" style="border:1px solid #cbd5e1; background:#fff; border-radius:6px; padding:2px 7px; font-size:0.75rem; cursor:pointer; color:#334155;">수정</button>
               <button type="button" class="assign-del-btn" data-idx="${idx}" style="border:1px solid #fecaca; background:#fef2f2; border-radius:6px; padding:2px 7px; font-size:0.75rem; cursor:pointer; color:#dc2626;">삭제</button>
             </span>`
          : '';

        return `
          <li style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span style="flex:1; word-break:keep-all;">${item.title}${dueDateSub}</span>
            <div style="display:flex; align-items:center; flex-shrink:0;">
              <span class="badge" style="background:${badge.color}">${badge.text}</span>
              ${actionButtons}
            </div>
          </li>
        `;
      })
      .join('');
  }

  // 과제 전용 탭일 때만 하단에 '새 과제 추가(달력 날짜 선택)' 폼 자동 생성
  const cardEl = assignmentListEl.closest('.card');
  if (!cardEl) return;

  let editorBox = cardEl.querySelector('#assignmentEditorBox');
  if (!editorBox) {
    editorBox = document.createElement('form');
    editorBox.id = 'assignmentEditorBox';
    editorBox.style.cssText = 'margin-top:16px; padding-top:14px; border-top:1px dashed #cbd5e1; display:flex; gap:8px; flex-wrap:wrap; align-items:center;';
    const todayStr = getFutureDateString(0);
    const defaultDueStr = getFutureDateString(3);

    editorBox.innerHTML = `
      <input type="text" id="newAssignTitle" placeholder="새 과제명 입력 (예: 데이터베이스 과제)" required
        style="flex:2; min-width:170px; padding:9px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem;" />
      <input type="date" id="newAssignDate" min="${todayStr}" value="${defaultDueStr}" required title="마감 날짜 선택"
        style="flex:1; min-width:135px; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; color:#1e293b;" />
      <button type="submit"
        style="padding:9px 16px; background:#1976d2; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:0.88rem; cursor:pointer;">
        + 추가
      </button>
※ 마감 날짜가 지나면 다음 날 자동으로 목록에서 삭제됩니다.

`;
cardEl.appendChild(editorBox);
editorBox.addEventListener('submit', (e) => {
e.preventDefault();
const titleInput = editorBox.querySelector('#newAssignTitle');
const dateInput = editorBox.querySelector('#newAssignDate');
const title = titleInput.value.trim();
const dueDate = dateInput.value;
if (!title || !dueDate) return;
if (getDiffDays(dueDate) < 0) {
alert('이미 지난 날짜는 등록할 수 없습니다. 오늘 이후 날짜를 선택해 주세요.');
return;
}
assignmentsStore[currentClass] = assignmentsStore[currentClass] || [];
assignmentsStore[currentClass].push({ title, dueDate });
assignmentsStore[currentClass].sort((a, b) => getDiffDays(a.dueDate) - getDiffDays(b.dueDate));
saveAssignmentsStore(assignmentsStore);
titleInput.value = '';
dateInput.value = getFutureDateString(3);
renderAssignments(currentClass);
});
}
editorBox.style.display = isAssignmentTab ? 'flex' : 'none';
// 수정 버튼 이벤트 (제목 및 마감 날짜 YYYY-MM-DD 수정)
assignmentListEl.querySelectorAll('.assign-edit-btn').forEach((btn) => {
btn.addEventListener('click', () => {
const idx = Number(btn.dataset.idx);
const target = assignmentsStore[currentClass].at(idx);
if (!target) return;
const newTitle = prompt('수정할 과제 제목을 입력하세요:', target.title);
if (newTitle === null || !newTitle.trim()) return;
const newDate = prompt('마감 날짜를 입력하세요 (YYYY-MM-DD 형식):', target.dueDate);
if (newDate === null || !/^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) {
if (newDate !== null) alert('날짜 형식이 올바르지 않습니다. (예: 2026-12-05)');
return;
}
if (getDiffDays(newDate.trim()) < 0) {
alert('이미 지난 날짜로 수정하면 즉시 만료 삭제됩니다. 오늘 이후 날짜를 입력해 주세요.');
return;
}
assignmentsStore[currentClass][idx] = { title: newTitle.trim(), dueDate: newDate.trim() };
assignmentsStore[currentClass].sort((a, b) => getDiffDays(a.dueDate) - getDiffDays(b.dueDate));
saveAssignmentsStore(assignmentsStore);
renderAssignments(currentClass);
});
});
// 삭제 버튼 이벤트
assignmentListEl.querySelectorAll('.assign-del-btn').forEach((btn) => {
btn.addEventListener('click', () => {
const idx = Number(btn.dataset.idx);
const target = assignmentsStore[currentClass].at(idx);
if (!target) return;
if (confirm(`${target.title} 과제를 삭제할까요?`)) {
assignmentsStore[currentClass].splice(idx, 1);
saveAssignmentsStore(assignmentsStore);
renderAssignments(currentClass);
}
});
});
}
// 5-1. 내 시간표 편집 (에브리타임처럼 수업 추가·삭제, localStorage 저장)
const CUSTOM_TIMETABLE_KEY = 'campusCustomTimetable_v1';
const DAY_NAMES = ['', '월', '화', '수', '목', '금'];

function escapeHTML(text) {
return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function loadCustomTimetables() {
try {
return JSON.parse(localStorage.getItem(CUSTOM_TIMETABLE_KEY)) || {};
} catch (e) {
console.warn('내 시간표 로드 실패:', e);
return {};
}
}

function saveCustomTimetables() {
try {
localStorage.setItem(CUSTOM_TIMETABLE_KEY, JSON.stringify(customTimetables));
} catch (e) {
console.warn('내 시간표 저장 실패:', e);
}
}

let customTimetables = loadCustomTimetables();
let isTimetableEditing = false; // '시간표 수정' 버튼을 눌렀을 때만 true
const profileKey = (cls, dept = currentDept, grade = currentGrade) => `${dept}|${grade}|${cls}`;

// 편집한 시간표가 있으면 그것을, 없으면 학과 기본 시간표를 사용
function getCourses(cls, dept = currentDept, grade = currentGrade) {
const custom = customTimetables[profileKey(cls, dept, grade)];
if (custom) return custom.map((c) => ({ ...c }));
return window.CampusData?.getDefaultCourses?.(dept, grade, cls) || [];
}

function getCurrentTimetable(cls) {
const courses = getCourses(cls);
const table = window.CampusData.makeTimetable(courses);
// 사용자가 입력한 과목명은 화면에 넣기 전에 이스케이프
table.rows = table.rows.map((row) => row.map((cell, idx) => (idx === 0 ? cell : escapeHTML(cell))));
const label = `${currentDept} ${window.CampusData.gradeText(currentGrade)} ${cls}반`;
const isCustom = Boolean(customTimetables[profileKey(cls)]);
const hasDefault = (window.CampusData.getDefaultCourses(currentDept, currentGrade, cls) || []).length > 0;
if (isCustom) table.note = `${label} · 내가 편집한 시간표입니다.`;
else if (hasDefault) table.note = `2026학년도 2학기 ${label} 시간표 (08.06 기준)`;
else table.note = `${label} 기본 시간표가 없어요. '시간표 수정' 버튼을 눌러 듣는 수업을 추가해 보세요.`;
return { ...table, courses, isCustom };
}

function saveCourses(cls, courses) {
customTimetables[profileKey(cls)] = courses.map(({ day, hour, span, name, prof }) => ({ day, hour, span, name, prof }));
saveCustomTimetables();
afterTimetableChange();
}

function afterTimetableChange() {
renderClass(currentClass);
window.CampusFeatures.renderProfessorRanking?.();
}

// 현재 학년(모든 반)의 시간표에 있는 교수님 목록 → 교수님 랭킹에서 사용
function getGradeProfessors() {
const classes = new Set(window.CampusData?.getClassList?.(currentDept, currentGrade) || []);
Object.keys(customTimetables).forEach((key) => {
const [dept, grade, cls] = key.split('|');
if (dept === currentDept && grade === currentGrade) classes.add(cls);
});
const byProf = new Map();
classes.forEach((cls) => {
getCourses(cls).forEach((course) => {
const prof = (course.prof || '').trim();
if (!prof) return;
if (!byProf.has(prof)) byProf.set(prof, new Set());
byProf.get(prof).add(course.name);
});
});
return Array.from(byProf, ([name, subjects]) => ({ name, subjects: Array.from(subjects) }));
}

// 시간표 아래 수업 추가 폼 렌더링 (시간표 탭에서만 표시)
function renderTimetableEditor(isScheduleTab, isCustom) {
const timetableEl = document.querySelector('#timetable');
const cardEl = timetableEl?.closest('.card');
if (!cardEl) return;

// 수정 모드 전환 버튼 (시간표 위)
let toggleBtn = cardEl.querySelector('#ttEditToggle');
if (!toggleBtn) {
toggleBtn = document.createElement('button');
toggleBtn.type = 'button';
toggleBtn.id = 'ttEditToggle';
toggleBtn.className = 'outline timetable-edit-toggle';
timetableEl.before(toggleBtn);
toggleBtn.addEventListener('click', () => {
isTimetableEditing = !isTimetableEditing;
renderClass(currentClass);
});
}
toggleBtn.style.display = isScheduleTab ? '' : 'none';
toggleBtn.textContent = isTimetableEditing ? '✅ 수정 완료' : '✏️ 시간표 수정';
toggleBtn.classList.toggle('primary', isTimetableEditing);
toggleBtn.classList.toggle('outline', !isTimetableEditing);
timetableEl.classList.toggle('editing', isTimetableEditing);

let editor = cardEl.querySelector('#timetableEditor');
if (!editor) {
editor = document.createElement('form');
editor.id = 'timetableEditor';
editor.className = 'timetable-editor';
const dayOptions = [1, 2, 3, 4, 5].map((d) => `<option value="${d}">${DAY_NAMES[d]}요일</option>`).join('');
const startOptions = [9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => `<option value="${h}">${String(h).padStart(2, '0')}:00</option>`).join('');
const endOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => `<option value="${h}">${String(h).padStart(2, '0')}:00</option>`).join('');
editor.innerHTML = `
<strong class="timetable-editor-title">➕ 수업 추가</strong>
<div class="timetable-editor-row">
<input type="text" id="ttName" placeholder="과목명 (예: 자료구조)" maxlength="30" required />
<input type="text" id="ttProf" placeholder="교수님 성함 (예: 김영수)" maxlength="15" />
</div>
<div class="timetable-editor-row">
<select id="ttDay" aria-label="요일">${dayOptions}</select>
<select id="ttStart" aria-label="시작 시간">${startOptions}</select>
<span class="muted">~</span>
<select id="ttEnd" aria-label="끝 시간">${endOptions}</select>
<button type="submit" class="primary">추가</button>
</div>
<p class="muted timetable-editor-hint">시간표의 수업을 누르면 삭제, 빈 칸을 누르면 그 요일·시간이 자동으로 입력돼요. 교수님 성함을 넣으면 교수님 랭킹에서 평가할 수 있어요.</p>
<button type="button" id="ttReset" class="light">기본 시간표로 되돌리기</button>
`;
cardEl.appendChild(editor);

editor.querySelector('#ttStart').addEventListener('change', (e) => {
const endSel = editor.querySelector('#ttEnd');
if (Number(endSel.value) <= Number(e.target.value)) endSel.value = String(Number(e.target.value) + 1);
});

editor.addEventListener('submit', (e) => {
e.preventDefault();
const name = editor.querySelector('#ttName').value.trim();
const prof = editor.querySelector('#ttProf').value.trim().replace(/\s*교수님$/, '');
const day = Number(editor.querySelector('#ttDay').value);
const hour = Number(editor.querySelector('#ttStart').value);
const end = Number(editor.querySelector('#ttEnd').value);
if (!name) return;
if (end <= hour) {
alert('끝 시간은 시작 시간보다 늦어야 해요.');
return;
}
const courses = getCourses(currentClass);
const clash = courses.find((c) => c.day === day && hour < c.hour + c.span && c.hour < end);
if (clash) {
alert(`${DAY_NAMES[day]}요일 ${clash.hour}시에 '${clash.name}' 수업과 시간이 겹쳐요.`);
return;
}
courses.push({ day, hour, span: end - hour, name, prof });
saveCourses(currentClass, courses);
editor.querySelector('#ttName').value = '';
editor.querySelector('#ttProf').value = '';
});

editor.querySelector('#ttReset').addEventListener('click', () => {
if (!confirm('편집한 내용을 지우고 기본 시간표로 되돌릴까요?')) return;
delete customTimetables[profileKey(currentClass)];
saveCustomTimetables();
afterTimetableChange();
});

// 시간표 칸 클릭: 수업 삭제 / 빈 칸은 추가 폼 자동 입력
timetableEl.addEventListener('click', (e) => {
const courseCell = e.target.closest('[data-course-idx]');
if (courseCell) {
const courses = getCourses(currentClass);
const idx = Number(courseCell.dataset.courseIdx);
const target = courses[idx];
if (target && confirm(`'${target.name}' 수업을 시간표에서 삭제할까요?`)) {
courses.splice(idx, 1);
saveCourses(currentClass, courses);
}
return;
}
const slot = e.target.closest('[data-slot-day]');
if (slot) {
editor.querySelector('#ttDay').value = slot.dataset.slotDay;
editor.querySelector('#ttStart').value = slot.dataset.slotHour;
editor.querySelector('#ttEnd').value = String(Number(slot.dataset.slotHour) + 1);
editor.querySelector('#ttName').focus();
}
});
}
editor.style.display = isScheduleTab && isTimetableEditing ? 'flex' : 'none';
editor.querySelector('#ttReset').style.display = isCustom ? '' : 'none';
}

// 6. 반(A/B) 선택에 따른 시간표 및 과제 전체 갱신
function renderClass(className) {
currentClass = className;
const data = getCurrentTimetable(className);
if (!data) return;
renderTodayHorizontal(className, data);
const mainEl = document.querySelector('main');
const isFullScheduleTab = mainEl && mainEl.classList.contains('single');
const timetableCard = document.querySelector('#timetable')?.closest('.card');
const headingEl = timetableCard ? timetableCard.querySelector('h2') : null;
if (headingEl) {
headingEl.innerHTML = isFullScheduleTab
? `📅 <span id="classTitle">${className}반</span> 이번 학기 시간표`
: `📅 <span id="classTitle">${className}반</span> 오늘의 시간표`;
}
const assignmentTitleEl = document.querySelector('#assignmentTitle');
if (assignmentTitleEl) assignmentTitleEl.textContent = `${className}반`;
const statusEl = document.querySelector('#classStatus');
if (statusEl) {
const currentText = statusEl.textContent;
if (currentText.includes('학년')) {
statusEl.textContent = currentText.replace(/\S+반$/, `${className}반`);
} else {
statusEl.textContent = `현재 ${className}반 정보를 보고 있어요.`;
}
}
const noteEl = document.querySelector('#classNote');
if (noteEl) noteEl.textContent = data.note;
// 시간표 탭을 벗어나면 수정 모드 자동 종료
if (!isFullScheduleTab) isTimetableEditing = false;
const timetableEl = document.querySelector('#timetable');
if (timetableEl) {
timetableEl.innerHTML = isFullScheduleTab
? buildWeeklyTimetable(data.rows, data.spans, data.cells, isTimetableEditing)
: buildTodayTimetable(data.rows, data.spans);
}
renderTimetableEditor(isFullScheduleTab, data.isCustom);
renderAssignments(className);
document.querySelectorAll('[data-class]').forEach((button) => {
button.classList.toggle('active', button.dataset.class === className);
});
}
// 7. 상단 반 전환 버튼을 학과·학년에 맞게 다시 만들기 (예: 3학년 → SAP반/SW반)
function renderClassButtons() {
const switchEl = document.querySelector('.class-switch');
if (!switchEl) return;
switchEl.querySelectorAll('[data-class]').forEach((btn) => btn.remove());
const setupBtn = switchEl.querySelector('#openSetupBtn');
const classList = window.CampusData?.getClassList?.(currentDept, currentGrade) || ['A', 'B'];
classList.forEach((cls) => {
const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'light';
btn.dataset.class = cls;
btn.textContent = `${cls}반`;
switchEl.insertBefore(btn, setupBtn);
});
}
// 8. 소속(학과·학년·반) 변경 시 시간표 갱신
function setScheduleProfile(profile) {
currentDept = profile.dept;
currentGrade = profile.grade;
renderClassButtons();
const classList = window.CampusData?.getClassList?.(currentDept, currentGrade) || ['A', 'B'];
renderClass(classList.includes(profile.className) ? profile.className : classList[0]);
}
function initializeClassSchedule() {
// 반 버튼은 다시 만들어지므로 이벤트 위임으로 처리
document.addEventListener('click', (e) => {
const button = e.target.closest('.class-switch [data-class]');
if (button) renderClass(button.dataset.class);
});
document.querySelectorAll('#bottomNav button').forEach((navBtn) => {
navBtn.addEventListener('click', () => setTimeout(() => renderClass(currentClass), 0));
});
renderClassButtons();
renderClass('A');
}
window.CampusFeatures.initializeClassSchedule = initializeClassSchedule;
window.CampusFeatures.setScheduleProfile = setScheduleProfile;
window.CampusFeatures.getGradeProfessors = getGradeProfessors;
window.CampusFeatures.getScheduleProfile = () => ({ dept: currentDept, grade: currentGrade, className: currentClass });
