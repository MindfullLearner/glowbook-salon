document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: false, activePage: 'dashboard' });
    if (!user) return; // initLayout already redirected

    document.getElementById('greeting').textContent = `Hi, ${user.name.split(' ')[0]}`;

    const result = await apiCall('dashboard.php');
    if (!result.success) return;

    const { stats, recent } = result;

    document.getElementById('stats-row').innerHTML = `
        <div class="stat-box"><div class="stat-number">${stats.total}</div><div class="stat-label">Total bookings</div></div>
        <div class="stat-box"><div class="stat-number">${stats.upcoming}</div><div class="stat-label">Upcoming</div></div>
        <div class="stat-box"><div class="stat-number">${stats.completed}</div><div class="stat-label">Completed</div></div>
    `;

    const container = document.getElementById('recent-container');
    if (recent.length === 0) {
        container.innerHTML = `<p class="empty-state">You haven't booked anything yet. <a href="book.html">Book your first appointment</a>.</p>`;
        return;
    }

    const rows = recent.map(row => `
        <tr>
            <td>${escapeHtml(row.service_name)}</td>
            <td>${formatDate(row.appointment_date)}</td>
            <td>${formatTime(row.appointment_time)}</td>
            <td><span class="badge badge-${row.status}">${capitalize(row.status)}</span></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>Service</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
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
