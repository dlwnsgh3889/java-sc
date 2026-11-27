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
  localStorage.removeItem('campusUserProfile');
  sessionStorage.removeItem('campusUserProfile');

  function applyUserProfile(profile) {
    currentProfile = profile;
    const subtitleEl = document.querySelector('.subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `${profile.dept} ${profile.grade}학년 · 수업, 공지, 과제와 학식을 한 화면에서 확인하세요.`;
    }

    // 선택한 반(A/B) 시간표 및 과제 반영
    const targetClassBtn = document.querySelector(`[data-class="${profile.className}"]`);
    if (targetClassBtn) targetClassBtn.click();

    // 선택한 학과 교수님 랭킹 반영
    if (window.CampusFeatures?.renderProfessorRanking) {
      window.CampusFeatures.renderProfessorRanking(profile.dept);
    }

    const statusEl = document.getElementById('classStatus');
    if (statusEl) {
      statusEl.textContent = `${profile.dept} ${profile.grade}학년 ${profile.className}반`;
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
      document.getElementById('selectGrade').value = currentProfile.grade;
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
