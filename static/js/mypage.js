document.getElementById('mypage-button').addEventListener('click', function() {
    console.log("마이페이지클릭");
    const modal = document.getElementById('mypage-modal');
    const content = document.getElementById('mypage-content');

    modal.style.display = "block";

    // AJAX 요청으로 mypage.html 내용 로드
    fetch('/mypage')
        .then(response => response.text())
        .then(data => {
            content.innerHTML = data;
            // 사용자 정보 로드
            loadUserInfo();
        })
        .catch(error => console.error('Error loading mypage content:', error));
});

function loadUserInfo() {
    // localStorage에서 username을 가져옵니다.
    const username = localStorage.getItem('username');
    console.log(username);
    if (username) {
        // 사용자 정보 API 호출
        fetch(`/api/user-info?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.username) {
                    // 사용자 정보 요소 업데이트
                    document.querySelector('#mypage-content .user-info p:nth-of-type(1)').innerHTML = `<strong>Username:</strong> ${data.username}`;
                    document.querySelector('#mypage-content .user-info p:nth-of-type(2)').innerHTML = `<strong>Email:</strong> ${data.email}`;
                    document.querySelector('#mypage-content .user-info p:nth-of-type(3)').innerHTML = `<strong>Joined Date:</strong> ${data.joinedDate}`;
                } else {
                    console.error('User not found or no data returned');
                }
            })
            .catch(error => console.error('Error fetching user info:', error));
    } else {
        console.error('Username not found in localStorage');
    }
}

// 모달 닫기 버튼 이벤트
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('mypage-modal').style.display = "none";
});

// 모달 창 외부를 클릭했을 때 닫기
window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('mypage-modal')) {
        document.getElementById('mypage-modal').style.display = "none";
    }
});