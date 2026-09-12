document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: true, activePage: 'admin-dashboard' });
    if (!user) return;

    const result = await apiCall('dashboard.php');
    if (!result.success) return;

    const { stats, recent } = result;

    document.getElementById('stats-row').innerHTML = `
        <div class="stat-box"><div class="stat-number">${stats.total_appointments}</div><div class="stat-label">Total appointments</div></div>
        <div class="stat-box"><div class="stat-number">${stats.today_appointments}</div><div class="stat-label">Scheduled today</div></div>
        <div class="stat-box"><div class="stat-number">${stats.pending_count}</div><div class="stat-label">Awaiting confirmation</div></div>
        <div class="stat-box"><div class="stat-number">${stats.total_users}</div><div class="stat-label">Total clients</div></div>
    `;

    const container = document.getElementById('recent-container');
    if (recent.length === 0) {
        container.innerHTML = `<p class="empty-state">No activity yet.</p>`;
        return;
    }

    const rows = recent.map(row => `
        <tr>
            <td>${escapeHtml(row.user_name)}</td>
            <td>${escapeHtml(row.service_name)}</td>
            <td>${formatDate(row.appointment_date)}</td>
            <td>${formatTime(row.appointment_time)}</td>
            <td><span class="badge badge-${row.status}">${capitalize(row.status)}</span></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>User</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
});

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
