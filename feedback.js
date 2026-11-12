function initializeFaq() {
  document.querySelectorAll('.faq-q').forEach((question) => question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
  }));
}

function initializeFeedback() {
  document.querySelector('#feedbackForm').addEventListener('submit', (event) => {
    event.preventDefault();
    alert('의견이 저장되었습니다. 감사합니다!');
    event.currentTarget.reset();
  });
}

window.CampusFeatures = window.CampusFeatures || {};
window.CampusFeatures.initializeFaq = initializeFaq;
window.CampusFeatures.initializeFeedback = initializeFeedback;