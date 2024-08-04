   // 메인 페이지에서만 실행되는 코드
   
   const logoutButton = document.getElementById('logout-button');
   
   if (localStorage.getItem('username')) {
       logoutButton.style.display = 'block';

       if (localStorage.getItem('is_admin') === 'true') {
           if (uploadForm) {
               uploadForm.style.display = 'block';
           }
       } else {
           if (uploadForm) {
               uploadForm.style.display = 'none';
           }
       }
   }

   if (logoutButton) {
       logoutButton.addEventListener('click', () => {
           localStorage.clear();
           if (uploadForm) {
               uploadForm.style.display = 'none';
           }
           window.location.href = '/'; // 로그아웃 후 로그인 페이지로 이동
       });
   }
