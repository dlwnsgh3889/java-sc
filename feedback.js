window.CampusFeatures = window.CampusFeatures || {};

const STORAGE_KEY = 'campusProfessorRankingData_v2';

// 1. 기본 초기 데이터 (모든 교수님 10표 이상 현실적인 표본 반영)
const defaultProfessorStoreByDept = {
  '스마트소프트웨어학과': {
    professors: [
      { id: 'sw1', name: '강도윤 교수님', subject: 'JavaScript실습', rating: 4.8, votes: 28 },
      { id: 'sw2', name: '서하은 교수님', subject: 'C프로그래밍', rating: 4.6, votes: 24 },
      { id: 'sw3', name: '조성훈 교수님', subject: '자료구조실습', rating: 4.5, votes: 21 },
      { id: 'sw4', name: '윤서연 교수님', subject: '리눅스실습', rating: 4.3, votes: 19 },
      { id: 'sw5', name: '임지훈 교수님', subject: 'Git · 협업실습', rating: 4.2, votes: 17 },
      { id: 'sw6', name: '백수빈 교수님', subject: '정보통신', rating: 4.1, votes: 15 },
      { id: 'sw7', name: '남궁현 교수님', subject: '디지털문해', rating: 4.0, votes: 14 },
      { id: 'sw8', name: '오채원 교수님', subject: '웹프레임워크기초', rating: 3.9, votes: 12 }
    ],
    reviews: [
      { profName: '강도윤 교수님', subject: 'JavaScript실습', star: 5, comment: '예제 코드가 실무 중심이라 이해하기 정말 쉬워요!' },
      { profName: '서하은 교수님', subject: 'C프로그래밍', star: 5, comment: '질문할 때마다 친절하게 디버깅 도와주십니다.' }
    ]
  },
  '스마트기계공학과': {
    professors: [
      { id: 'me1', name: '한재민 교수님', subject: 'CAD/CAM설계', rating: 4.7, votes: 26 },
      { id: 'me2', name: '송지아 교수님', subject: '기계공작법실습', rating: 4.6, votes: 23 },
      { id: 'me3', name: '권혁진 교수님', subject: '재료역학', rating: 4.4, votes: 20 },
      { id: 'me4', name: '문채린 교수님', subject: '열유체역학', rating: 4.3, votes: 18 },
      { id: 'me5', name: '배준영 교수님', subject: '자동화시스템실습', rating: 4.2, votes: 16 },
      { id: 'me6', name: '신유나 교수님', subject: '기계요소설계', rating: 4.1, votes: 15 },
      { id: 'me7', name: '장민혁 교수님', subject: '3D프린팅응용', rating: 4.0, votes: 13 },
      { id: 'me8', name: '류소민 교수님', subject: '기계제도기초', rating: 3.9, votes: 11 }
    ],
    reviews: [
      { profName: '한재민 교수님', subject: 'CAD/CAM설계', star: 5, comment: '도면 해석부터 모델링까지 차근차근 알려주십니다.' },
      { profName: '송지아 교수님', subject: '기계공작법실습', star: 5, comment: '실습 장비 다루는 팁을 꼼꼼하게 짚어주세요.' }
    ]
  },
  '스마트전기전자공학과': {
    professors: [
      { id: 'ee1', name: '최시우 교수님', subject: '회로이론', rating: 4.8, votes: 30 },
      { id: 'ee2', name: '정다인 교수님', subject: '마이크로프로세서', rating: 4.6, votes: 25 },
      { id: 'ee3', name: '안태양 교수님', subject: '전력전자공학', rating: 4.5, votes: 22 },
      { id: 'ee4', name: '홍예진 교수님', subject: '디지털논리회로', rating: 4.3, votes: 19 },
      { id: 'ee5', name: '황지성 교수님', subject: 'PLC제어실습', rating: 4.2, votes: 17 },
      { id: 'ee6', name: '전하린 교수님', subject: '전자기학', rating: 4.1, votes: 15 },
      { id: 'ee7', name: '고은우 교수님', subject: '신호및시스템', rating: 4.0, votes: 14 },
      { id: 'ee8', name: '양서현 교수님', subject: '기초전기실험', rating: 3.9, votes: 12 }
    ],
    reviews: [
      { profName: '최시우 교수님', subject: '회로이론', star: 5, comment: '복잡한 회로 해석 공식도 직관적으로 설명해 주십니다.' },
      { profName: '정다인 교수님', subject: '마이크로프로세서', star: 5, comment: '펌웨어 실습 과제가 알차서 실력이 많이 늘었어요.' }
    ]
  }
};

// 2. localStorage에서 저장된 데이터 불러오기 및 저장하기
function loadProfessorStore() {
  try {
    localStorage.removeItem('campusProfessorRankingData_v1');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('저장된 랭킹 데이터 로드 실패:', e);
  }
  return JSON.parse(JSON.stringify(defaultProfessorStoreByDept));
}

function saveProfessorStore(storeData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
  } catch (e) {
    console.warn('랭킹 데이터 저장 실패:', e);
  }
}

let professorStoreByDept = loadProfessorStore();
let activeProfDept = '스마트소프트웨어학과';

// 3. 학과별 교수님 랭킹 및 최근 의견 화면 렌더링
function renderProfessorRanking(deptName = activeProfDept) {
  if (professorStoreByDept.hasOwnProperty(deptName)) activeProfDept = deptName;
  const store = professorStoreByDept.hasOwnProperty(activeProfDept)
    ? professorStoreByDept[activeProfDept]
    : professorStoreByDept['스마트소프트웨어학과'];

  document.querySelectorAll('.dept-title-text').forEach((el) => {
    el.textContent = activeProfDept;
  });

  // 평균 별점 높은 순 (동점 시 투표수 많은 순)
  const sorted = [...store.professors].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.votes - a.votes;
  });

  const buildRankingHTML = (list) =>
    list
      .map((item, idx) => {
        const rank = idx + 1;
        const medalClass = rank <= 3 ? `rank-${rank}` : '';
        return `
          <li class="prof-rank-item">
            <div class="prof-rank-left">
              <span class="rank-medal ${medalClass}">${rank}</span>
              <div class="prof-info">
                <span class="prof-name">${item.name}</span>
                <span class="prof-subject">${item.subject}</span>
              </div>
            </div>
            <span class="prof-score">★ ${item.rating.toFixed(1)} (${item.votes}표)</span>
          </li>
        `;
      })
      .join('');

  // 메인 화면 인기 교수님 랭킹 (TOP 3) + 최신 의견 1건 (.at(0)으로 첫 번째 리뷰 안전 추출)
  const mainListEl = document.querySelector('#professorRankingList');
  if (mainListEl) {
    const latestReview = store.reviews.at(0);
    const latestReviewHTML = latestReview
      ? `<li style="background:#f8fbfe; border-radius:8px; padding:10px 12px; margin-top:8px; border-bottom:0; display:block;">
           <div style="font-size:0.78rem; color:var(--blue); font-weight:700; margin-bottom:2px;">
             💬 최신 의견 · ${latestReview.profName} (${'★'.repeat(latestReview.star)})
           </div>
           <div style="font-size:0.84rem; color:var(--ink);">"${latestReview.comment}"</div>
         </li>`
      : '';

    mainListEl.innerHTML = buildRankingHTML(sorted.slice(0, 3)) + latestReviewHTML;
  }

  // 교수랭킹 탭 실시간 랭킹 (TOP 3)
  const profListEl = document.querySelector('#etcProfessorRankingList');
  if (profListEl) {
    profListEl.innerHTML = buildRankingHTML(sorted.slice(0, 3));
  }

  // 교수님 선택 드롭다운 (8명 전체)
  const profSelectEl = document.querySelector('#ratingProfSelect');
  if (profSelectEl) {
    const prevSelected = profSelectEl.value;
    profSelectEl.innerHTML = store.professors
      .map((p) => `<option value="${p.id}">${p.name} (${p.subject})</option>`)
      .join('');
    if (prevSelected && store.professors.some((p) => p.id === prevSelected)) {
      profSelectEl.value = prevSelected;
    }
  }

  // 최근 한줄 의견 목록
  const reviewListEl = document.querySelector('#profReviewList');
  if (reviewListEl) {
    reviewListEl.innerHTML = store.reviews
      .map((rev) => {
        const stars = '★'.repeat(rev.star) + '☆'.repeat(5 - rev.star);
        return `
          <li class="review-item">
            <div class="review-top">
              <strong>${rev.profName} <span class="muted">· ${rev.subject}</span></strong>
              <span class="review-stars">${stars}</span>
            </div>
            <p class="review-text">${rev.comment}</p>
          </li>
        `;
      })
      .join('');
  }
}

// 4. 별점 선택 및 의견 제출 이벤트 초기화
function initializeProfessorRanking() {
  const starButtons = document.querySelectorAll('#starPicker .star-btn');
  const starInput = document.getElementById('ratingStarValue');
  const starLabel = document.getElementById('starScoreLabel');
  const ratingForm = document.getElementById('profRatingForm');

  starButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedStar = Number(btn.dataset.star);
      if (starInput) starInput.value = selectedStar;
      if (starLabel) starLabel.textContent = `${selectedStar.toFixed(1)}점`;
      starButtons.forEach((sBtn) => sBtn.classList.toggle('active', Number(sBtn.dataset.star) <= selectedStar));
    });
  });

  if (ratingForm) {
    ratingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const profId = document.getElementById('ratingProfSelect').value;
      const star = Number(document.getElementById('ratingStarValue').value || 5);
      const commentInput = document.getElementById('ratingCommentInput');
      const comment = commentInput.value.trim();
      if (!comment) return;

      const store = professorStoreByDept.hasOwnProperty(activeProfDept)
        ? professorStoreByDept[activeProfDept]
        : professorStoreByDept['스마트소프트웨어학과'];
      const targetProf = store.professors.find((p) => p.id === profId);

      if (targetProf) {
        const totalScore = targetProf.rating * targetProf.votes + star;
        targetProf.votes += 1;
        targetProf.rating = Math.round((totalScore / targetProf.votes) * 10) / 10;
        store.reviews.unshift({ profName: targetProf.name, subject: targetProf.subject, star, comment });

        saveProfessorStore(professorStoreByDept);
      }

      renderProfessorRanking(activeProfDept);

      commentInput.value = '';
      if (starInput) starInput.value = '5';
      if (starLabel) starLabel.textContent = '5.0점';
      starButtons.forEach((sBtn) => sBtn.classList.add('active'));

      alert('⭐ 별점과 의견이 저장되어 새로고침 후에도 유지됩니다!');
    });
  }

  renderProfessorRanking('스마트소프트웨어학과');
}

// 5. FAQ 아코디언 및 기타 건의사항 폼 초기화
function initializeFaq() {
  document.querySelectorAll('.faq-q').forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      if (answer) answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
    });
  });
}

function initializeFeedback() {
  const feedbackForm = document.querySelector('#feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('의견이 저장되었습니다. 감사합니다!');
      event.currentTarget.reset();
    });
  }
}

window.CampusFeatures.initializeProfessorRanking = initializeProfessorRanking;
window.CampusFeatures.renderProfessorRanking = renderProfessorRanking;
window.CampusFeatures.initializeFaq = initializeFaq;
window.CampusFeatures.initializeFeedback = initializeFeedback;
