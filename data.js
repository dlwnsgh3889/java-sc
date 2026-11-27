window.CampusData = window.CampusData || {};
window.CampusFeatures = window.CampusFeatures || {};

// 1. 학식 메뉴 데이터
window.CampusData.meals = {
  breakfast: { title: '조식 · 08:00 ~ 09:00', main: '흰쌀밥 · 북엇국 · 계란말이', side: '김치 · 샐러드 · 우유' },
  lunch: { title: '중식 · 11:30 ~ 13:30', main: '돈까스 정식 · 김치찌개 · 잡곡밥', side: '샐러드바 · 깍두기 · 후식' },
  dinner: { title: '석식 · 17:00 ~ 18:30', main: '제육볶음 · 된장국 · 흰쌀밥', side: '콩나물무침 · 김치 · 과일' }
};

// 2. 학과 · 학년 · 반별 기본 시간표 데이터
// 수업 한 개 = [요일(1=월 ~ 5=금), 시작 시각(9~17시), 연속 교시 수, 과목명, 교수님]
window.CampusData.TIMETABLE_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// 2026학년도 2학기 스마트소프트웨어학과 강의시간표(08.06 기준)
// ※ 정보통신 '신규강사'는 학과 홈페이지 교수 소개(정보통신 담당)를 참고해 하현태 교수님으로 표기
window.CampusData.timetables = {
  '스마트소프트웨어학과': {
    '1': {
      A: [
        [1, 9, 4, 'C 프로그래밍', '이승익'], [1, 14, 1, '디지털문해', '정선미'],
        [2, 9, 3, '자료구조', '김영수'],
        [3, 9, 4, '리눅스', '최재영'], [3, 14, 1, 'Git', '이재범'],
        [4, 9, 4, 'JavaScript', '변유찬'], [4, 14, 4, '정보통신', '하현태']
      ],
      B: [
        [1, 9, 4, '정보통신', '하현태'], [1, 15, 1, '디지털문해', '정선미'],
        [2, 9, 4, '리눅스', '최재영'], [2, 14, 3, '자료구조', '김영수'],
        [3, 9, 4, 'JavaScript', '변유찬'], [3, 15, 1, 'Git', '이재범'],
        [4, 9, 4, 'C 프로그래밍', '이승익']
      ]
    },
    '2': {
      A: [
        [1, 13, 1, '창업과기업가정신', '최은아'], [1, 14, 4, 'React', '김범준'],
        [3, 9, 4, '데이터베이스실습', '이재범'],
        [4, 9, 3, 'ERPSim', '이덕기'], [4, 14, 4, '알고리즘', '김형건'],
        [5, 9, 2, 'JAVA심화', '안진희'], [5, 11, 2, 'JAVA프로그래밍심화', '안진희']
      ],
      B: [
        [1, 9, 3, 'ERPSim', '이덕기'], [1, 13, 1, '창업과기업가정신', '최은아'], [1, 14, 4, 'React', '김범준'],
        [4, 9, 4, '알고리즘', '김형건'],
        [5, 9, 4, '데이터베이스실습', '이재범'], [5, 14, 2, 'JAVA심화', '안진희'], [5, 16, 2, 'JAVA프로그래밍심화', '안진희']
      ]
    },
    '3': {
      SAP: [
        [1, 9, 4, '정보처리공학', '조소현'], [1, 14, 4, 'Fiori기초', '변유찬'],
        [4, 9, 4, 'ABAP프로그래밍 심화', '김범준'], [4, 14, 4, '캡스톤디자인', '김영수'],
        [5, 9, 4, '클라우드컴퓨팅', '김범준']
      ],
      SW: [
        [1, 14, 4, '정보처리공학', '조소현'],
        [2, 9, 4, '임베디드 프로그래밍', '이재범'],
        [3, 9, 4, '클라우드컴퓨팅', '김범준'],
        [4, 9, 4, 'Spring', '이재범'], [4, 14, 4, '캡스톤디자인', '김영수']
      ]
    },
    // 전공심화과정
    '심화': {
      SAP: [
        [1, 9, 4, 'AI 비즈니스모델', '하병국'],
        [2, 9, 4, 'AI 융합캡스톤디자인', '이덕기'],
        [3, 9, 4, 'SAP MM', '이덕기'], [3, 14, 4, 'SAP ABAP 프로젝트', '김영수']
      ],
      SW: [
        [1, 14, 4, 'AI 비즈니스모델', '하병국'],
        [2, 9, 4, 'AI 융합캡스톤디자인', '이덕기'],
        [3, 9, 4, '컴퓨터비전', '이승익'],
        [5, 9, 4, '소프트웨어 테스팅', '김영수']
      ]
    }
  }
};

// 학과·학년에 맞는 반 목록 (시간표가 있으면 그 반들, 없으면 A/B반)
window.CampusData.getClassList = function (dept, grade) {
  const byGrade = window.CampusData.timetables?.[dept]?.[grade];
  return byGrade ? Object.keys(byGrade) : ['A', 'B'];
};

// 학과·학년·반의 기본 수업 목록 (객체 배열로 변환, 없으면 빈 배열)
window.CampusData.getDefaultCourses = function (dept, grade, className) {
  const list = window.CampusData.timetables?.[dept]?.[grade]?.[className] || [];
  return list.map(([day, hour, span, name, prof]) => ({ day, hour, span, name, prof: prof || '' }));
};

// 수업 목록 → 표 그리기용 rows / spans / cells 생성
window.CampusData.makeTimetable = function (courses) {
  const rows = window.CampusData.TIMETABLE_HOURS.map((time) => [time, '', '', '', '', '']);
  const spans = {};
  const cells = {};
  courses.forEach((course, idx) => {
    const rowIndex = course.hour - 9;
    if (!rows[rowIndex]) return;
    const key = `${rowIndex}-${course.day}`;
    rows[rowIndex][course.day] = course.name;
    cells[key] = { ...course, idx };
    if (course.span > 1) spans[key] = course.span;
  });
  return { rows, spans, cells };
};

window.CampusData.gradeText = (grade) => (grade === '심화' ? '심화과정' : `${grade}학년`);

// 3. 반별 과제 초기 데이터
window.CampusData.classData = {
  A: {
    assignments: [
      ['C프로그래밍 실습 과제', 'D-3', '#ef4444'],
      ['자료구조실습 연결 리스트 구현', 'D-6', '#f59e0b'],
      ['JavaScript 팀프로젝트 초안', 'D-8', '#2563eb']
    ]
  },
  B: {
    assignments: [
      ['리눅스실습 파일 권한 과제', 'D-2', '#ef4444'],
      ['Git 브랜치 실습 보고서', 'D-5', '#f59e0b'],
      ['정보통신 퀴즈', 'D-9', '#2563eb']
    ]
  }
};

// 4. 학식 탭 전환 기능
function showMeal(mealKey) {
  const meal = window.CampusData?.meals?.[mealKey];
  const panel = document.querySelector('#mealPanel');
  if (!meal || !panel) return;

  panel.innerHTML = `<strong>${meal.title}</strong><p>${meal.main}</p><p>반찬: ${meal.side}</p>`;
  document.querySelectorAll('.meal-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.meal === mealKey);
  });
}

function initializeMealMenu() {
  document.querySelectorAll('.meal-tab').forEach((button) => {
    button.addEventListener('click', () => showMeal(button.dataset.meal));
  });
  showMeal('breakfast');
}

window.CampusFeatures.initializeMealMenu = initializeMealMenu;
