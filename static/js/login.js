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
        if (data.success) {
            localStorage.setItem('username', username);
            window.location.href = '/main';
        } else {
            alert('Login failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

document.getElementById('showSignup').addEventListener('click', function() {
    document.getElementById('login-container').classList.remove('active');
    document.getElementById('signup-container').classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', function() {
    document.getElementById('signup-container').classList.remove('active');
    document.getElementById('login-container').classList.add('active');
});
