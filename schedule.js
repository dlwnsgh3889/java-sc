let currentClass = 'A';

function buildWeeklyTimetable(rows, spans) {
  const covered = new Set();
  let html = '';
  rows.forEach((row, rowIndex) => {
    html += '<tr>';
    row.forEach((cell, colIndex) => {
      if (colIndex === 0) { html += `<td>${cell}</td>`; return; }
      const key = `${rowIndex}-${colIndex}`;
      if (covered.has(key)) return;
      const span = spans[key] || 1;
      for (let index = 1; index < span; index += 1) covered.add(`${rowIndex + index}-${colIndex}`);
      html += `<td ${span > 1 ? `rowspan="${span}"` : ''} class="${cell ? 'course' : ''}">${cell}</td>`;
    });
    html += '</tr>';
  });
  return `<thead><tr><th>시간</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th></tr></thead><tbody>${html}</tbody>`;
}

function buildTodayTimetable(rows, spans) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayIndex = new Date().getDay();
  const todayName = days[todayIndex];

  if (todayIndex === 0 || todayIndex === 6) {
    return `<tbody><tr><td colspan="2" style="padding: 20px; color: var(--muted);">오늘은 수업이 없는 주말(${todayName}요일)입니다. 🎉</td></tr></tbody>`;
  }

  let html = '';
  let skipCount = 0;

  rows.forEach((row, rowIndex) => {
    const time = row[0];
    if (skipCount > 0) { skipCount -= 1; return; }

    const course = row[todayIndex];
    const key = `${rowIndex}-${todayIndex}`;
    const span = spans[key] || 1;
    if (span > 1) skipCount = span - 1;

    const startHour = parseInt(time.split(':')[0], 10);
    const endHour = String(startHour + span).padStart(2, '0') + ':00';
    const timeRange = span > 1 ? `${time} ~ ${endHour}` : time;

    html += `<tr><td style="width: 35%;">${timeRange}</td><td class="${course ? 'course' : ''}">${course || '-'}</td></tr>`;
  });

  return `<thead><tr><th>시간</th><th>오늘 (${todayName}요일)</th></tr></thead><tbody>${html}</tbody>`;
}

function renderClass(className) {
  currentClass = className;
  const data = window.CampusData?.classData?.[className];
  if (!data) return;

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
      statusEl.textContent = currentText.replace(/[AB]반$/, `${className}반`);
    } else {
      statusEl.textContent = `현재 ${className}반 정보를 보고 있어요.`;
    }
  }

  const noteEl = document.querySelector('#classNote');
  if (noteEl) noteEl.textContent = data.note;

  const timetableEl = document.querySelector('#timetable');
  if (timetableEl) {
    timetableEl.innerHTML = isFullScheduleTab
      ? buildWeeklyTimetable(data.rows, data.spans)
      : buildTodayTimetable(data.rows, data.spans);
  }

  const assignmentListEl = document.querySelector('#assignmentList');
  if (assignmentListEl) {
    assignmentListEl.innerHTML = data.assignments
      .map(([title, day, color]) => `<li><span>${title}</span><span class="badge" style="background:${color}">${day}</span></li>`)
      .join('');
  }

  document.querySelectorAll('[data-class]').forEach((button) => {
    button.classList.toggle('active', button.dataset.class === className);
  });
}

function initializeClassSchedule() {
  document.querySelectorAll('[data-class]').forEach((button) => {
    button.addEventListener('click', () => renderClass(button.dataset.class));
  });
  document.querySelectorAll('#bottomNav button').forEach((navBtn) => {
    navBtn.addEventListener('click', () => setTimeout(() => renderClass(currentClass), 0));
  });
  renderClass('A');
}

window.CampusFeatures = window.CampusFeatures || {};
window.CampusFeatures.initializeClassSchedule = initializeClassSchedule;
