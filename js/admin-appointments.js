document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: true, activePage: 'admin-appointments' });
    if (!user) return;

    const container = document.getElementById('appointments-container');
    const alertBox = document.getElementById('alert-box');
    const filterForm = document.getElementById('filter-form');

    async function loadAppointments() {
        const search = document.getElementById('search').value.trim();
        const status = document.getElementById('status-filter').value;
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);

        const result = await apiCall(`appointments.php?${params.toString()}`);
        if (!result.success) {
            showAlert(container, escapeHtml(result.message), 'error');
            return;
        }
        renderTable(result.appointments);
    }

    function renderTable(appointments) {
        if (appointments.length === 0) {
            container.innerHTML = `<p class="empty-state">No appointments found.</p>`;
            return;
        }

        const rows = appointments.map(row => {
            let actions = '';
            if (row.status === 'pending') actions += `<button type="button" class="btn-link" data-status="${row.id}:confirmed">Confirm</button>`;
            if (row.status === 'confirmed') actions += `<button type="button" class="btn-link" data-status="${row.id}:completed">Mark done</button>`;
            if (row.status !== 'cancelled' && row.status !== 'completed') {
                actions += `<button type="button" class="btn-link danger" data-status="${row.id}:cancelled">Cancel</button>`;
            }
            return `
            <tr>
                <td>${escapeHtml(row.user_name)}<br><small class="muted">${escapeHtml(row.user_email)}</small></td>
                <td>${escapeHtml(row.service_name)}</td>
                <td>${escapeHtml(row.stylist_name || 'Any stylist')}</td>
                <td>${formatDate(row.appointment_date)}</td>
                <td>${formatTime(row.appointment_time)}</td>
                <td><span class="badge badge-${row.status}">${capitalize(row.status)}</span></td>
                <td class="actions-cell">${actions || '<span class="muted">—</span>'}</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>User</th><th>Service</th><th>Stylist</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        container.querySelectorAll('[data-status]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const [id, status] = btn.dataset.status.split(':');
                if (status === 'cancelled' && !confirm('Cancel this appointment?')) return;
                const result = await apiCall('appointments.php', 'PUT', { id, status });
                if (result.success) {
                    showAlert(alertBox, escapeHtml(result.message), 'success');
                    loadAppointments();
                } else {
                    showAlert(alertBox, escapeHtml(result.message), 'error');
                }
            });
        });
    }

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadAppointments();
    });

    loadAppointments();
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
