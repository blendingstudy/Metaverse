document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const chatContainer = document.querySelector('.chat-container');
    const logoutButton = document.getElementById('logout-button');

    if (localStorage.getItem('username')) {
        chatContainer.style.display = 'block';
        logoutButton.style.display = 'block';

        if (localStorage.getItem('is_admin') === 'true') {
            if (uploadForm) { // 요소가 존재하는지 확인
                uploadForm.style.display = 'block';
            }
        } else {
            if (uploadForm) { // 요소가 존재하는지 확인
                uploadForm.style.display = 'none';
            }
        }
    }

    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('http://127.0.0.1:8081/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username, password: password })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response Data:', data); // 응답 데이터 출력

            if (data.success) {
                localStorage.setItem('username', username);
                localStorage.setItem('is_admin', data.is_admin); // 로그인 성공 시 is_admin 저장

                // 페이지 새로 고침 없이 UI 업데이트
                if (data.is_admin) {
                    if (uploadForm) { // 요소가 존재하는지 확인
                        uploadForm.style.display = 'block'; // 관리자만 업로드 폼 표시
                    }
                } else {
                    if (uploadForm) { // 요소가 존재하는지 확인
                        uploadForm.style.display = 'none'; // 관리자 외에는 업로드 폼 숨기기
                    }
                }
                
                chatContainer.style.display = 'block';
                logoutButton.style.display = 'block';
                window.location.href = '/main'; // 로그인 성공 후 메인 페이지로 이동
            } else {
                alert('Login failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.clear();
        chatContainer.style.display = 'none';
        if (uploadForm) { // 요소가 존재하는지 확인
            uploadForm.style.display = 'none'; // 로그아웃 시 업로드 폼 숨기기
        }
        window.location.href = '/'; // 로그아웃 후 로그인 페이지로 이동
    });
});