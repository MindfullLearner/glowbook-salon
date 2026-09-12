document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, skip straight to the right dashboard
    (async () => {
        const check = await apiCall('auth/me.php');
        if (check.loggedIn) {
            window.location.href = check.user.role === 'admin' ? 'admin/dashboard.html' : 'dashboard.html';
        }
    })();

    const form = document.getElementById('login-form');
    const alertBox = document.getElementById('alert-box');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.innerHTML = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        const result = await apiCall('auth/login.php', 'POST', { email, password });

        submitBtn.disabled = false;
        submitBtn.textContent = 'Log in';

        if (result.success) {
            window.location.href = result.user.role === 'admin' ? 'admin/dashboard.html' : 'dashboard.html';
        } else {
            showAlert(alertBox, escapeHtml(result.message), 'error');
        }
    });
});
