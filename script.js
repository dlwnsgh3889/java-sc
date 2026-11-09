// ==========================================
// [구동 엔진] 화면 로드가 완료되면 기능을 활성화하는 메인 함수
// ==========================================
function initializeApp() {
    const modeToggle = document.getElementById('modeToggle');
    const professorProfileCard = document.getElementById('professorProfileCard');

    // 💡 1. [교수 과목 표시] 체크박스 상태에 따라 왼쪽 위 교수 패널 토글
    if (modeToggle && professorProfileCard) {
        modeToggle.addEventListener('change', function() {
            if (this.checked) {
                professorProfileCard.style.display = 'block'; // 교수님 담당 과목 배지 노출
                alert('👨‍🏫 교수님 전용 담당 과목 패널이 대시보드 좌측 상단에 활성화되었습니다.');
            } else {
                professorProfileCard.style.display = 'none';  // 체크 해제 시 숨김
            }
        });
    }

    // 2. 자주 묻는 질문 (FAQ) 아코디언 토글 제어
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            if (answer) {
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    question.style.backgroundColor = '#f8f9fa';
                } else {
                    answer.style.display = 'block';
                    question.style.backgroundColor = '#e6f2ff';
                }
            }
        });
    });

    // 3. 교수님 관리 패널 - 실시간 공지/과제 업로드 프로세스
    const professorForm = document.getElementById('professorForm');
    if (professorForm) {
        professorForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const type = document.getElementById('uploadType').value;
            const title = document.getElementById('uploadTitle').value.trim();
            const date = document.getElementById('uploadDate').value;
            
            if (!title) { 
                alert('내용을 누락 없이 입력해 주세요.'); 
                return; 
            }
            
            if (type === 'notice') {
                const noticeList = document.getElementById('noticeList');
                const today = new Date();
                const dateString = `${today.getMonth() + 1}/${today.getDate()}`;
                const newNotice = document.createElement('li');
                newNotice.className = 'list-item';
                newNotice.innerHTML = `<span>${title}</span><span style="color: #ff4d4d; font-weight:bold;">New (${dateString})</span>`;
                
                if (noticeList) {
                    noticeList.insertBefore(newNotice, noticeList.firstChild);
                    alert('📢 작성하신 공지사항이 전체 학생 대시보드에 실시간 전송되었습니다!');
                }
            } else if (type === 'assignment') {
                if (!date) { 
                    alert('과제 통제를 위한 마감 날짜를 지정해 주세요.'); 
                    return; 
                }
                const assignmentList = document.getElementById('assignmentList');
                const ddayValue = calculateDDay(date); 
                const newAssignment = document.createElement('li');
                newAssignment.className = 'list-item';
                newAssignment.innerHTML = `<span>${title}</span><span class="d-day" style="background-color:#ff4d4d;">${ddayValue}</span>`;
                
                if (assignmentList) {
                    assignmentList.appendChild(newAssignment);
                    alert('🔥 새로운 과제 디데이 타이머가 학생 화면에 동기화되었습니다!');
                }
            }
            professorForm.reset();
        });
    }

    // 디데이 타이머 최초 연산 구동
    initDDayElements();
}

// ==========================================
// [유틸리티] 과제 마감일 실시간 디데이 계산 처리 연산식
// ==========================================
function calculateDDay(targetDateString) {
    const today = new Date(); 
    const targetDate = new Date(targetDateString);
    today.setHours(0, 0, 0, 0); 
    targetDate.setHours(0, 0, 0, 0);
    
    const differenceInTime = targetDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    if (differenceInDays === 0) return "D-Day";
    else if (differenceInDays > 0) return `D-${differenceInDays}`;
    else return `만료 (D+${Math.abs(differenceInDays)})`;
}

function initDDayElements() {
    const ddayBadges = document.querySelectorAll('.d-day');
    const deadlines = ["2026-11-13", "2026-11-15"]; 
    
    ddayBadges.forEach((badge, index) => {
        if (deadlines[index]) {
            badge.textContent = calculateDDay(deadlines[index]);
            if (badge.textContent === "D-Day" || badge.textContent.includes("만료")) {
                badge.style.backgroundColor = "#ff4d4d";
            }
        }
    });
}

// 💡 브라우저가 HTML의 모든 구조를 다 로드한 시점에 안정적으로 초기화 함수를 호출
document.addEventListener('DOMContentLoaded', initializeApp);
