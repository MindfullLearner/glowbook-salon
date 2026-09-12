document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const alertBox = document.getElementById('alert-box');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.innerHTML = '';

        const payload = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirm_password').value,
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        const result = await apiCall('auth/register.php', 'POST', payload);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Create account';

        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            const list = (result.errors || [result.message]).map(escapeHtml).map(m => `<li>${m}</li>`).join('');
            alertBox.innerHTML = `<div class="alert alert-error"><ul>${list}</ul></div>`;
        }
    });
});
