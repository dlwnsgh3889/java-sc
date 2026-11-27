window.CampusFeatures = window.CampusFeatures || {};

// 1. 하단 내비게이션 탭 전환 기능
function switchTab(target) {
  const mainEl = document.querySelector('#mainContainer');
  const cards = document.querySelectorAll('main .card');
  const navButtons = document.querySelectorAll('#bottomNav button');

  navButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.target === target));

  const isNoticeTab = target === 'notice';
  if (mainEl) {
    mainEl.classList.toggle('single', target !== 'main' && !isNoticeTab);
    mainEl.classList.toggle('notice-single-view', isNoticeTab);
  }

  const schoolHeading = document.querySelector('#schoolNoticeHeading');
  if (schoolHeading) schoolHeading.textContent = isNoticeTab ? '📢 학교 공지' : '📢 학교 공지 요약';

  const deptHeading = document.querySelector('#deptNoticeHeading');
  if (deptHeading) deptHeading.textContent = isNoticeTab ? '📌 학과 공지사항' : '📌 학과 공지 요약';

  document.querySelectorAll('#noticeMoreBtn, #deptNoticeMoreBtn').forEach((btn) => {
    btn.style.display = isNoticeTab ? 'inline-flex' : 'none';
  });

  document.querySelectorAll('#schoolNoticeHeading, #deptNoticeHeading, .notice-row-link').forEach((link) => {
    link.style.pointerEvents = isNoticeTab ? 'auto' : 'none';
  });

  cards.forEach((card) => {
    const tabs = (card.dataset.tab || '').split(' ');
    card.classList.toggle('hidden', !tabs.includes(target));
  });
}

function initializeNavigation() {
  const navButtons = document.querySelectorAll('#bottomNav button');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });
  switchTab('main');
}

// 2. 초기 소속 설정 및 소속 변경 모달 기능
function initializeUserSetup() {
  const overlay = document.getElementById('setupOverlay');
  const form = document.getElementById('setupForm');
  const openSetupBtn = document.getElementById('openSetupBtn');
  const closeSetupBtn = document.getElementById('closeSetupBtn');
  const setupTitle = document.getElementById('setupTitle');
  const setupDesc = document.getElementById('setupDesc');
  const submitBtn = form?.querySelector('button[type="submit"]');

  let currentProfile = { dept: '스마트소프트웨어학과', grade: '1', className: 'A' };

  // 2년제 학과는 3학년 선택을 막고, 심화과정이 있는 학과만 '심화' 표시
  const deptSelect = document.getElementById('selectDept');
  const gradeSelect = document.getElementById('selectGrade');
  function syncGradeOptions() {
    if (!deptSelect || !gradeSelect) return;
    const deptOpt = deptSelect.selectedOptions[0];
    const years = Number(deptOpt?.dataset.years || 3);
    const hasAdvanced = deptOpt?.dataset.advanced === 'true';
    Array.from(gradeSelect.options).forEach((opt) => {
      const allowed = opt.value === '심화' ? hasAdvanced : Number(opt.value) <= years;
      opt.disabled = !allowed;
      opt.hidden = !allowed;
    });
    if (gradeSelect.selectedOptions[0]?.disabled) gradeSelect.value = String(years);
  }

  // 학과·학년에 맞게 반 목록 변경 (예: 스마트소프트웨어학과 3학년 → SAP반/SW반)
  const classSelect = document.getElementById('selectClass');
  function syncClassOptions() {
    if (!deptSelect || !gradeSelect || !classSelect) return;
    const prev = classSelect.value;
    const classList = window.CampusData?.getClassList?.(deptSelect.value, gradeSelect.value) || ['A', 'B'];
    classSelect.innerHTML = classList.map((cls) => `<option value="${cls}">${cls}반</option>`).join('');
    if (classList.includes(prev)) classSelect.value = prev;
  }

  deptSelect?.addEventListener('change', () => {
    syncGradeOptions();
    syncClassOptions();
  });
  gradeSelect?.addEventListener('change', syncClassOptions);
  syncGradeOptions();
  syncClassOptions();
  localStorage.removeItem('campusUserProfile');
  sessionStorage.removeItem('campusUserProfile');

  const gradeLabel = (grade) => (grade === '심화' ? '심화과정' : `${grade}학년`);

  function applyUserProfile(profile) {
    currentProfile = profile;
    const subtitleEl = document.querySelector('.subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `${profile.dept} ${gradeLabel(profile.grade)} · 수업, 공지, 과제와 학식을 한 화면에서 확인하세요.`;
    }

    // 선택한 학과·학년·반 시간표 및 과제 반영
    if (window.CampusFeatures?.setScheduleProfile) {
      window.CampusFeatures.setScheduleProfile(profile);
    }

    // 선택한 학과 교수님 랭킹 반영
    if (window.CampusFeatures?.renderProfessorRanking) {
      window.CampusFeatures.renderProfessorRanking(profile.dept);
    }

    const statusEl = document.getElementById('classStatus');
    if (statusEl) {
      statusEl.textContent = `${profile.dept} ${gradeLabel(profile.grade)} ${profile.className}반`;
    }
  }

  if (overlay) {
    overlay.classList.add('fullscreen');
    overlay.classList.remove('hidden');
    if (setupTitle) setupTitle.textContent = '🎓 캠퍼스 라이프 어시스턴트';
    if (setupDesc) setupDesc.textContent = '시작하기 전에 학과, 학년, 반을 선택해 주세요.';
    if (submitBtn) submitBtn.textContent = '대시보드 시작하기';
  }

  if (openSetupBtn && overlay) {
    openSetupBtn.addEventListener('click', () => {
      document.getElementById('selectDept').value = currentProfile.dept;
      syncGradeOptions();
      document.getElementById('selectGrade').value = currentProfile.grade;
      syncClassOptions();
      document.getElementById('selectClass').value = currentProfile.className;
      overlay.classList.remove('fullscreen');
      overlay.classList.remove('hidden');
      if (setupTitle) setupTitle.textContent = '⚙️ 소속 변경';
      if (setupDesc) setupDesc.textContent = '변경할 학과, 학년, 반을 선택해 주세요.';
      if (submitBtn) submitBtn.textContent = '변경 내용 저장';
    });
  }

  if (closeSetupBtn && overlay) {
    closeSetupBtn.addEventListener('click', () => overlay.classList.add('hidden'));
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (!overlay.classList.contains('fullscreen') && e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  }

  if (form && overlay) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const profile = {
        dept: document.getElementById('selectDept').value,
        grade: document.getElementById('selectGrade').value,
        className: document.getElementById('selectClass').value
      };
      overlay.classList.add('hidden');
      overlay.classList.remove('fullscreen');
      applyUserProfile(profile);
    });
  }
}

window.CampusFeatures.initializeNavigation = initializeNavigation;
window.CampusFeatures.initializeUserSetup = initializeUserSetup;
