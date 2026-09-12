document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: false, activePage: 'appointments' });
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
            const canModify = row.status === 'pending' || row.status === 'confirmed';
            return `
            <tr>
                <td>${escapeHtml(row.service_name)}</td>
                <td>${escapeHtml(row.stylist_name || 'Any stylist')}</td>
                <td>${formatDate(row.appointment_date)}</td>
                <td>${formatTime(row.appointment_time)}</td>
                <td>Rs. ${Math.round(row.price)}</td>
                <td><span class="badge badge-${row.status}">${capitalize(row.status)}</span></td>
                <td class="actions-cell">
                    ${canModify
                        ? `<button type="button" class="btn-link" data-toggle-reschedule="${row.id}">Reschedule</button>
                           <button type="button" class="btn-link danger" data-cancel="${row.id}">Cancel</button>`
                        : `<span class="muted">—</span>`}
                </td>
            </tr>
            ${canModify ? `
            <tr class="reschedule-row" id="reschedule-${row.id}">
                <td colspan="7">
                    <form class="reschedule-form" data-reschedule-id="${row.id}">
                        <label>New date <input type="date" name="new_date" min="${new Date().toISOString().split('T')[0]}" required></label>
                        <label>New time <input type="time" name="new_time" required></label>
                        <button type="submit" class="btn-primary small">Save</button>
                    </form>
                </td>
            </tr>` : ''}
            `;
        }).join('');

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Service</th><th>Stylist</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        // Toggle reschedule row
        container.querySelectorAll('[data-toggle-reschedule]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById(`reschedule-${btn.dataset.toggleReschedule}`).classList.toggle('open');
            });
        });

        // Cancel appointment
        container.querySelectorAll('[data-cancel]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Cancel this appointment?')) return;
                const result = await apiCall(`appointments.php?id=${btn.dataset.cancel}`, 'DELETE');
                if (result.success) {
                    showAlert(alertBox, escapeHtml(result.message), 'success');
                    loadAppointments();
                } else {
                    showAlert(alertBox, escapeHtml(result.message), 'error');
                }
            });
        });

        // Reschedule form submit
        container.querySelectorAll('.reschedule-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = form.dataset.rescheduleId;
                const payload = {
                    id,
                    appointment_date: form.querySelector('[name="new_date"]').value,
                    appointment_time: form.querySelector('[name="new_time"]').value,
                };
                const result = await apiCall('appointments.php', 'PUT', payload);
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
