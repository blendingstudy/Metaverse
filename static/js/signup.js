// signup.js
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    const email = document.getElementById('email').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    // 회원가입 정보를 서버로 보낼 데이터 객체 생성
    const signupData = {
        username: newUsername,
        email: email,
        password: newPassword
    };

    // fetch API를 사용하여 회원가입 정보를 서버로 전송
    fetch('http://127.0.0.1:8081/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Sign up successful!');
            // 예시: 폼 초기화
            document.getElementById('signupForm').reset();
        } else {
            alert('Sign up failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during sign up.');
    });
});
document.getElementById('showSignup').addEventListener('click', function() {
    document.getElementById('login-container').classList.remove('active');
    document.getElementById('signup-container').classList.add('active');
});