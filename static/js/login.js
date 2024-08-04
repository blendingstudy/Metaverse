document.addEventListener('DOMContentLoaded', () => {

    {
        // 로그인 페이지에서만 실행되는 코드
        const loginForm = document.getElementById('loginForm');

        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
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
                .then(response => response.json())  // JSON 데이터를 파싱
                .then(data => {
                    console.log(data);
                    if (data.success) {
                        localStorage.setItem('username', username);
                        localStorage.setItem('is_admin', data.is_admin);
                        window.location.href = '/main'; // 로그인 성공 후 메인 페이지로 이동
                    } else {
                        alert('Login failed');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            });
        }
    }
});