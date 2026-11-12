function buildTimetable(rows, spans) {
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

function renderClass(className) {
  const data = window.CampusData.classData[className];
  document.querySelector('#classTitle').textContent = `${className}반`;
  document.querySelector('#assignmentTitle').textContent = `${className}반`;
  document.querySelector('#classStatus').textContent = `현재 ${className}반 정보를 보고 있어요.`;
  document.querySelector('#classNote').textContent = data.note;
  document.querySelector('#timetable').innerHTML = buildTimetable(data.rows, data.spans);
  document.querySelector('#assignmentList').innerHTML = data.assignments
    .map(([title, day, color]) => `<li><span>${title}</span><span class="badge" style="background:${color}">${day}</span></li>`)
    .join('');
  document.querySelectorAll('[data-class]').forEach((button) => button.classList.toggle('active', button.dataset.class === className));
}

function initializeClassSchedule() {
  document.querySelectorAll('[data-class]').forEach((button) => button.addEventListener('click', () => renderClass(button.dataset.class)));
  renderClass('A');
}

window.CampusFeatures = window.CampusFeatures || {};
window.CampusFeatures.initializeClassSchedule = initializeClassSchedule;