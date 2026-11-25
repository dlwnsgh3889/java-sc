document.addEventListener('DOMContentLoaded', () => {
  function initMealMenuLocal() {
    const showMealLocal = (mealKey) => {
      const meal = window.CampusData?.meals?.[mealKey];
      const panel = document.querySelector('#mealPanel');
      if (!meal || !panel) return;
      panel.innerHTML = `<strong>${meal.title}</strong><p>${meal.main}</p><p>반찬: ${meal.side}</p>`;
      document.querySelectorAll('.meal-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.meal === mealKey));
    };
    document.querySelectorAll('.meal-tab').forEach((btn) => btn.addEventListener('click', () => showMealLocal(btn.dataset.meal)));
    showMealLocal('breakfast');
  }

  initMealMenuLocal();

  if (window.CampusFeatures) {
    if (typeof window.CampusFeatures.initializeClassSchedule === 'function') window.CampusFeatures.initializeClassSchedule();
    if (typeof window.CampusFeatures.initializeProfessorRanking === 'function') window.CampusFeatures.initializeProfessorRanking();
  }

  async function updateJinjuWeather() {
    const iconEl = document.querySelector('.weather-pill .w-ico');
    const tempEl = document.querySelector('.weather-pill .w-temp');
    const descEl = document.querySelector('.weather-pill .w-desc');
    if (!iconEl || !tempEl || !descEl) return;

    try {
      const url = 'https://open-meteo.com';
      const response = await fetch(url);
      if (!response.ok) throw new Error('날씨 로드 실패');
      const data = await response.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      let icon = '🌤️', status = '맑음', umbrella = '우산 불필요';
      if (code === 0) { icon = '☀️'; status = '맑음'; }
      else if (code >= 1 && code <= 3) { icon = '⛅'; status = '구름 조금'; }
      else if (code === 45 || code === 48) { icon = '🌫️'; status = '안개'; }
      else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { icon = '🌧️'; status = '비'; umbrella = '우산 챙기세요 ☔'; }
      else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) { icon = '❄️'; status = '눈'; umbrella = '눈길 조심 · 우산 챙기세요'; }
      else if (code >= 95) { icon = '⛈️'; status = '뇌우'; umbrella = '우산 필수 ☔'; }

      iconEl.textContent = icon;
      tempEl.textContent = `진주 ${temp}°C · ${status}`;
      descEl.textContent = `${umbrella} · 상세보기 ↗`;
    } catch (e) { console.warn(e); }
  }

  async function loadKoreaHotNews() {
    const listEl = document.querySelector('#koreaNewsList');
    if (!listEl) return;
    const fallbackNews = [
      { title: '국내 AI·반도체 산업 차세대 인재 양성 지원 확대 발표', source: '경제', link: 'https://naver.com' },
      { title: '전국 대학가 하반기 캡스톤디자인 및 산학협력 페스티벌 개막', source: '사회', link: 'https://naver.com' },
      { title: '기상청, 이번 주 전국 대체로 맑고 일교차 큰 날씨 전망', source: '생활', link: 'https://naver.com' }
    ];

    try {
      const rssUrl = encodeURIComponent('https://google.com');
      const response = await fetch(`https://rss2json.com{rssUrl}`);
      if (!response.ok) throw new Error('뉴스 로드 실패');
      const data = await response.json();
      const items = (data.items || []).slice(0, 3);
      if (items.length === 0) throw new Error('항목 없음');

      listEl.innerHTML = items.map((item) => {
        const parts = item.title.split(' - ');
        const source = parts.length > 1 ? parts.pop() : '주요뉴스';
        return `<li><a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-item-link"><span class="news-title-text">${parts.join(' - ')}</span><span class="muted news-source-tag">${source}</span></a></li>`;
      }).join('');
    } catch (e) {
      listEl.innerHTML = fallbackNews.map((item) => `<li><a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-item-link"><span class="news-title-text">${item.title}</span><span class="muted news-source-tag">${item.source}</span></a></li>`).join('');
    }
  }

  const mainEl = document.querySelector('#mainContainer');
  const cards = document.querySelectorAll('main .card');
  const navButtons = document.querySelectorAll('#bottomNav button');

  function switchTab(target) {
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
    document.querySelectorAll('#noticeMoreBtn, #deptNoticeMoreBtn').forEach((btn) => { btn.style.display = isNoticeTab ? 'inline-flex' : 'none'; });
    document.querySelectorAll('#schoolNoticeHeading, #deptNoticeHeading, .notice-row-link').forEach((link) => { link.style.pointerEvents = isNoticeTab ? 'auto' : 'none'; });
    cards.forEach((card) => {
      const tabs = (card.dataset.tab || '').split(' ');
      card.classList.toggle('hidden', !tabs.includes(target));
    });
  }

  navButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.target)));

  function renderTodaySchedule(className) {
    const data = window.CampusData?.classData?.[className];
    if (!data) return;
    document.querySelectorAll('.class-title-text').forEach((el) => { el.textContent = `${className}반`; });
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const todayIndex = new Date().getDay();
    const todayName = days[todayIndex];
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
      const time = row[0];
      const course = row[todayIndex];
      if (course) {
        const hour24 = parseInt(time.split(':')[0], 10);
        const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
        html += `<div class="today-course-chip"><span class="today-course-time">${hour12}시</span><span>${course}</span></div>`;
      }
    });
    container.innerHTML = html || `<div class="today-empty">오늘은 예정된 수업이 없습니다. 😊</div>`;
  }

  document.querySelectorAll('[data-class]').forEach((btn) => {
    btn.addEventListener('click', () => renderTodaySchedule(btn.dataset.class));
  });

  function initUserSetup() {
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
      if (subtitleEl) subtitleEl.textContent = `${profile.dept} ${profile.grade}학년 · 수업, 공지, 과제와 학식을 한 화면에서 확인하세요.`;

      const targetClassBtn = document.querySelector(`[data-class="${profile.className}"]`);
      if (targetClassBtn) targetClassBtn.click();
      else renderTodaySchedule(profile.className);

      if (window.CampusFeatures?.renderProfessorRanking) window.CampusFeatures.renderProfessorRanking(profile.dept);

      const statusEl = document.getElementById('classStatus');
      if (statusEl) statusEl.textContent = `${profile.dept} ${profile.grade}학년 ${profile.className}반`;
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

    if (closeSetupBtn && overlay) closeSetupBtn.addEventListener('click', () => overlay.classList.add('hidden'));
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (!overlay.classList.contains('fullscreen') && e.target === overlay) overlay.classList.add('hidden');
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
updateJinjuWeather();
loadKoreaHotNews();
switchTab('main');
initUserSetup();
});