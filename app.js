// ==========================================
// [앱 통합 실행 파일] app.js
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. 기존 모듈 초기화 (학식 메뉴, 전체 시간표 등)
  if (window.CampusFeatures) {
    if (typeof window.CampusFeatures.initializeMealMenu === 'function') {
      window.CampusFeatures.initializeMealMenu();
    }
    if (typeof window.CampusFeatures.initializeClassSchedule === 'function') {
      window.CampusFeatures.initializeClassSchedule();
    }
  }

  // 2. 실시간 진주 날씨 연동 (Open-Meteo 무료 API)
  async function updateJinjuWeather() {
    const iconEl = document.querySelector('.weather-pill .w-ico');
    const tempEl = document.querySelector('.weather-pill .w-temp');
    const descEl = document.querySelector('.weather-pill .w-desc');

    if (!iconEl || !tempEl || !descEl) return;

    try {
      const url = 'https://open-meteo.com';
      const response = await fetch(url);
      if (!response.ok) throw new Error('날씨 데이터를 불러오지 못했습니다.');

      const data = await response.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      let icon = '🌤️';
      let status = '맑음';
      let umbrella = '우산 불필요';

      if (code === 0) {
        icon = '☀️';
        status = '맑음';
      } else if (code >= 1 && code <= 3) {
        icon = '⛅';
        status = '구름 조금';
      } else if (code === 45 || code === 48) {
        icon = '🌫️';
        status = '안개';
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        icon = '🌧️';
        status = '비';
        umbrella = '우산 챙기세요 ☔';
      } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        icon = '❄️';
        status = '눈';
        umbrella = '눈길 조심 · 우산 챙기세요';
      } else if (code >= 95) {
        icon = '⛈️';
        status = '뇌우';
        umbrella = '우산 필수 ☔';
      }

      iconEl.textContent = icon;
      tempEl.textContent = `진주 ${temp}°C · ${status}`;
      descEl.textContent = `${umbrella} · 상세보기 ↗`;
    } catch (error) {
      console.warn('실시간 날씨 업데이트 실패:', error);
    }
  }

  // 3. 대한민국 주요 이슈 뉴스 연동 (Google News KR RSS -> JSON 변환 API)
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
      if (!response.ok) throw new Error('뉴스 데이터를 불러오지 못했습니다.');

      const data = await response.json();
      const items = (data.items || []).slice(0, 3);

      if (items.length === 0) throw new Error('뉴스 항목 없음');

      listEl.innerHTML = items
        .map((item) => {
          const parts = item.title.split(' - ');
          const source = parts.length > 1 ? parts.pop() : '주요뉴스';
          const cleanTitle = parts.join(' - ');

          return `
            <li>
              <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-item-link">
                <span class="news-title-text">${cleanTitle}</span>
                <span class="muted news-source-tag">${source}</span>
              </a>
            </li>
          `;
        })
        .join('');
    } catch (error) {
      console.warn('실시간 뉴스 로드 실패, 기본 뉴스 표시:', error);
      listEl.innerHTML = fallbackNews
        .map(
          (item) => `
          <li>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-item-link">
              <span class="news-title-text">${item.title}</span>
              <span class="muted news-source-tag">${item.source}</span>
            </a>
          </li>
        `
        )
        .join('');
    }
  }

  // 4. 교수님 랭킹 데이터
  const professorRankings = {
    A: [
      { rank: 1, name: '김민수 교수님', subject: 'JavaScript실습', score: '★ 4.9 (128표)' },
      { rank: 2, name: '이지은 교수님', subject: 'C프로그래밍', score: '★ 4.8 (114표)' },
      { rank: 3, name: '박현우 교수님', subject: '리눅스실습', score: '★ 4.7 (96표)' }
    ],
    B: [
      { rank: 1, name: '정수진 교수님', subject: '자료구조실습', score: '★ 4.9 (135표)' },
      { rank: 2, name: '최동훈 교수님', subject: 'Git · 협업실습', score: '★ 4.8 (119표)' },
      { rank: 3, name: '한소희 교수님', subject: '정보통신', score: '★ 4.6 (88표)' }
    ]
  };

  // 5. 하단 탭 전환 기능
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
    if (schoolHeading) {
      schoolHeading.textContent = isNoticeTab ? '📢 학교 공지' : '📢 학교 공지 요약';
    }

    const deptHeading = document.querySelector('#deptNoticeHeading');
    if (deptHeading) {
      deptHeading.textContent = isNoticeTab ? '📌 학과 공지사항' : '📌 학과 공지 요약';
    }

    const noticeMoreBtns = document.querySelectorAll('#noticeMoreBtn, #deptNoticeMoreBtn');
    noticeMoreBtns.forEach((btn) => {
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

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });

  // 6. [메인 화면 전용] 가로형 오늘의 시간표 렌더링
  function renderTodaySchedule(className) {
    const data = window.CampusData?.classData?.[className];
    if (!data) return;

    document.querySelectorAll('.class-title-text').forEach((el) => {
      el.textContent = `${className}반`;
    });

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
        html += `
          <div class="today-course-chip">
            <span class="today-course-time">${hour12}시</span>
            <span>${course}</span>
          </div>
        `;
      }
    });

    container.innerHTML = html || `<div class="today-empty">오늘은 예정된 수업이 없습니다. 😊</div>`;
  }

  // 7. 교수님 랭킹 렌더링
  function renderProfessorRanking(className) {
    const listEl = document.querySelector('#professorRankingList');
    if (!listEl) return;

    const rankings = professorRankings[className] || professorRankings.A;
    listEl.innerHTML = rankings
      .map(
        (item) => `
        <li class="prof-rank-item">
          <div class="prof-rank-left">
            <span class="rank-medal rank-${item.rank}">${item.rank}</span>
            <div class="prof-info">
              <span class="prof-name">${item.name}</span>
              <span class="prof-subject">${item.subject}</span>
            </div>
          </div>
          <span class="prof-score">${item.score}</span>
        </li>
      `
      )
      .join('');
  }

  // 8. 상단 A반 / B반 전환 버튼 이벤트 연결
  document.querySelectorAll('[data-class]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedClass = btn.dataset.class;
      renderTodaySchedule(selectedClass);
      renderProfessorRanking(selectedClass);
    });
  });

  // 9. 초기 화면 구동
  updateJinjuWeather();
  loadKoreaHotNews();
  switchTab('main');
  renderTodaySchedule('A');
  renderProfessorRanking('A');
});
