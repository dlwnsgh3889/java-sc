// ============================================================
// 캠퍼스 라이프 어시스턴트 - 전체 JavaScript 파일
// 시간표, 과제, 학식, FAQ, 피드백 기능을 이 파일에서 관리합니다.
// ============================================================

// [1] 수정하기 쉬운 데이터 영역
const meals = {
  breakfast: { title: '조식 · 08:00 ~ 09:00', main: '흰쌀밥 · 북엇국 · 계란말이', side: '김치 · 샐러드 · 우유' },
  lunch: { title: '중식 · 11:30 ~ 13:30', main: '돈까스 정식 · 김치찌개 · 잡곡밥', side: '샐러드바 · 깍두기 · 후식' },
  dinner: { title: '석식 · 17:00 ~ 18:30', main: '제육볶음 · 된장국 · 흰쌀밥', side: '콩나물무침 · 김치 · 과일' }
};

// rows 형식: [시간, 월, 화, 수, 목, 금]
// spans 형식: '행번호-열번호': 세로로 차지할 시간 수
const classData = {
  A: {
    note: '첨부한 2026년 2학기 A반 실제 시간표를 반영했습니다.',
    rows: [
      ['09:00', 'C프로그래밍', '자료구조실습', '리눅스실습', 'JavaScript실습', ''],
      ['10:00', '', '', '', '', ''], ['11:00', '', '', '', '', ''], ['12:00', '', '', '', '', ''],
      ['14:00', '디지털문해', '', 'Git', '정보통신', ''], ['15:00', '', '', '', '', ''],
      ['16:00', '', '', '', '', ''], ['17:00', '', '', '', '', '']
    ],
    spans: { '0-1': 4, '0-2': 3, '0-3': 4, '0-4': 4, '4-4': 4 },
    assignments: [
      ['C프로그래밍 실습 과제', 'D-3', '#ef4444'],
      ['자료구조실습 연결 리스트 구현', 'D-6', '#f59e0b'],
      ['JavaScript 팀프로젝트 초안', 'D-8', '#2563eb']
    ]
  },
  B: {
    note: 'B반 시간표와 과제는 반별 화면 전환 시연을 위한 예시 데이터입니다.',
    rows: [
      ['09:00', '자료구조실습', '', 'C프로그래밍', '리눅스실습', ''],
      ['10:00', '', '', '', '', ''], ['11:00', '', '', '', '', ''], ['12:00', '', '', '', '', ''],
      ['14:00', 'Git', '디지털문해', '', 'JavaScript실습', ''], ['15:00', '', '', '', '', ''],
      ['16:00', '', '', '', '정보통신', ''], ['17:00', '', '', '', '', '']
    ],
    spans: { '0-1': 3, '0-3': 4, '0-4': 3, '4-4': 2, '6-4': 2 },
    assignments: [
      ['리눅스실습 파일 권한 과제', 'D-2', '#ef4444'],
      ['Git 브랜치 실습 보고서', 'D-5', '#f59e0b'],
      ['정보통신 퀴즈', 'D-9', '#2563eb']
    ]
  }
};

// [2] 반별 시간표와 과제 기능
function buildTimetable(rows, spans) {
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

      const span = spans[key] || 1;
      for (let index = 1; index < span; index += 1) {
        covered.add(`${rowIndex + index}-${colIndex}`);
      }

      html += `<td ${span > 1 ? `rowspan="${span}"` : ''} class="${cell ? 'course' : ''}">${cell}</td>`;
    });
    html += '</tr>';
  });

  return `<thead><tr><th>시간</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th></tr></thead><tbody>${html}</tbody>`;
}

function renderClass(className) {
  const data = classData[className];
  document.querySelector('#classTitle').textContent = `${className}반`;
  document.querySelector('#assignmentTitle').textContent = `${className}반`;
  document.querySelector('#classStatus').textContent = `현재 ${className}반 정보를 보고 있어요.`;
  document.querySelector('#classNote').textContent = data.note;
  document.querySelector('#timetable').innerHTML = buildTimetable(data.rows, data.spans);
  document.querySelector('#assignmentList').innerHTML = data.assignments
    .map(([title, day, color]) => `<li><span>${title}</span><span class="badge" style="background:${color}">${day}</span></li>`)
    .join('');

  document.querySelectorAll('[data-class]').forEach((button) => {
    button.classList.toggle('active', button.dataset.class === className);
  });
}

function initializeClassSchedule() {
  document.querySelectorAll('[data-class]').forEach((button) => {
    button.addEventListener('click', () => renderClass(button.dataset.class));
  });
  renderClass('A');
}

// [3] 조식·중식·석식 기능
function showMeal(mealKey) {
  const meal = meals[mealKey];
  document.querySelector('#mealPanel').innerHTML = `<strong>${meal.title}</strong><p>${meal.main}</p><p>반찬: ${meal.side}</p>`;
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

// [4] FAQ 기능
function initializeFaq() {
  document.querySelectorAll('.faq-q').forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
    });
  });
}

// [5] 피드백 기능
function initializeFeedback() {
  document.querySelector('#feedbackForm').addEventListener('submit', (event) => {
    event.preventDefault();
    alert('의견이 저장되었습니다. 감사합니다!');
    event.currentTarget.reset();
  });
}

// [6] 앱 실행
initializeClassSchedule();
initializeMealMenu();
initializeFaq();
initializeFeedback();
