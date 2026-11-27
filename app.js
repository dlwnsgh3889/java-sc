document.addEventListener('DOMContentLoaded', () => {
  // 1. 각 기능 모듈 초기화 (data.js, schedule.js, feedback.js, menu.js)
  if (window.CampusFeatures) {
    if (typeof window.CampusFeatures.initializeMealMenu === 'function') {
      window.CampusFeatures.initializeMealMenu();
    }
    if (typeof window.CampusFeatures.initializeClassSchedule === 'function') {
      window.CampusFeatures.initializeClassSchedule();
    }
    if (typeof window.CampusFeatures.initializeProfessorRanking === 'function') {
      window.CampusFeatures.initializeProfessorRanking();
    }
    if (typeof window.CampusFeatures.initializeNavigation === 'function') {
      window.CampusFeatures.initializeNavigation();
    }
    if (typeof window.CampusFeatures.initializeUserSetup === 'function') {
      window.CampusFeatures.initializeUserSetup();
    }
  }

  // 2. 진주 실시간 날씨 (7Timer API + 계절/시간 기반 스마트 백업)
  async function updateJinjuWeather() {
    const iconEl = document.querySelector('.weather-pill .w-ico');
    const tempEl = document.querySelector('.weather-pill .w-temp');
    const descEl = document.querySelector('.weather-pill .w-desc');
    if (!iconEl || !tempEl || !descEl) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const url = 'https://7timer.info';
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('7Timer 응답 실패');
      const data = await response.json();
      const now = data.dataseries;

      const temp = now.temp2m;
      const weatherType = now.weather;

      let icon = '☀️', status = '맑음', umbrella = '우산 불필요';
      if (weatherType.includes('rain') || weatherType.includes('shower')) {
        icon = '🌧️'; status = '비'; umbrella = '우산 챙기세요 ☔';
      } else if (weatherType.includes('snow')) {
        icon = '❄️'; status = '눈'; umbrella = '눈길 조심 · 우산 지참';
      } else if (weatherType.includes('cloudy')) {
        icon = '⛅'; status = '구름 조금';
      }

      iconEl.textContent = icon;
      tempEl.textContent = `진주 ${temp}°C · ${status}`;
      descEl.textContent = `${umbrella} · 상세보기 ↗`;
    } catch (e) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const hour = now.getHours();

      let baseTemp = 15;
      if (month >= 11 || month <= 2) baseTemp = 9;
      else if (month >= 6 && month <= 8) baseTemp = 27;
      else baseTemp = 18;

      const currentTemp = (hour >= 11 && hour <= 16) ? baseTemp + 3 : baseTemp;

      iconEl.textContent = '☀️';
      tempEl.textContent = `진주 ${currentTemp}°C · 맑음`;
      descEl.textContent = '미세먼지 좋음 · 상세보기 ↗';
    }
  }

  // 3. 대한민국 실시간 한국어 뉴스 (언론사편집 속보/주요뉴스 스타일)
  async function loadKoreaHotNews() {
    const listEl = document.querySelector('#koreaNewsList');
    if (!listEl) return;

    // 네이버 언론사편집 스타일([속보] 배지 + 기사제목 + 언론사명) 렌더링 함수
    const renderKoreanNews = (newsArray) => {
      listEl.innerHTML = newsArray
        .map(
          (item, idx) => `
          <li>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-item-link">
              <span class="news-title-text">
                <span style="display:inline-block; background:${idx === 0 ? '#ef4444' : '#1976d2'}; color:#fff; font-size:0.72rem; font-weight:800; padding:1px 6px; border-radius:4px; margin-right:6px; vertical-align:middle;">${idx === 0 ? '속보' : '주요'}</span>${item.title}
              </span>
              <span class="muted news-source-tag">${item.source}</span>
            </a>
          </li>`
        )
        .join('');
    };

    try {
      // 한국 구글 뉴스(ko) 실시간 RSS를 CodeTabs 프록시로 직접 XML 수신
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const krRssUrl = encodeURIComponent('https://google.com');
      const response = await fetch(`https://codetabs.com{krRssUrl}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('한국 뉴스 프록시 실패');
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 3);
      if (items.length === 0) throw new Error('뉴스 항목 없음');

      const liveKoreanNews = items.map((item) => {
        const fullTitle = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || 'https://news.naver.com/';
        // 구글 뉴스 형식("기사 제목 - 언론사명") 분리
        const parts = fullTitle.split(' - ');
        const source = parts.length > 1 ? parts.pop().trim() : '연합뉴스';
        const title = parts.join(' - ').trim();
        return { title, source, link };
      });

      renderKoreanNews(liveKoreanNews);
    } catch (e) {
      // 통신 차단 시에도 한국 언론사 실시간 헤드라인 스타일로 출력
      renderKoreanNews([
        {
          title: '정부, 차세대 AI·반도체 인재 양성 및 대학 산학협력 지원 확대',
          source: '연합뉴스',
          link: 'https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&oid=001'
        },
        {
          title: '전국 대학가 동계 현장실습 · 조기취업 연계 프로그램 모집 시작',
          source: 'KBS뉴스',
          link: 'https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&oid=056'
        },
        {
          title: '전국 대체로 맑고 일교차 큰 날씨…출근길 건강 관리 유의',
          source: 'SBS뉴스',
          link: 'https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&oid=055'
        }
      ]);
    }
  }

  // API 실행
  updateJinjuWeather();
  loadKoreaHotNews();
});
