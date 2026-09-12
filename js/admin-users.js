document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: true, activePage: 'admin-users' });
    if (!user) return;

    const container = document.getElementById('users-container');
    const filterForm = document.getElementById('filter-form');

    async function loadUsers() {
        const search = document.getElementById('search').value.trim();
        const params = new URLSearchParams();
        if (search) params.set('search', search);

        const result = await apiCall(`users.php?${params.toString()}`);
        if (!result.success) {
            showAlert(container, escapeHtml(result.message), 'error');
            return;
        }
        renderTable(result.users);
    }

    function renderTable(users) {
        if (users.length === 0) {
            container.innerHTML = `<p class="empty-state">No users found.</p>`;
            return;
        }
        const rows = users.map(u => `
            <tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.phone || '—')}</td>
                <td>${u.appointment_count}</td>
                <td>${formatDate(u.created_at)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Joined</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadUsers();
    });

    loadUsers();
});

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
