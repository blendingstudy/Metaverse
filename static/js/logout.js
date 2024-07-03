document.getElementById('logout-button').addEventListener('click', () => {
    // localStorage에서 username 제거
    localStorage.removeItem('username');
    // /login 페이지로 이동
    window.location.href = '/';
});