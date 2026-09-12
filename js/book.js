document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: false, activePage: 'book' });
    if (!user) return;

    // Minimum date = today
    const dateInput = document.getElementById('appointment_date');
    dateInput.min = new Date().toISOString().split('T')[0];

    // Load active services into the dropdown
    const serviceSelect = document.getElementById('service_id');
    const servicesResult = await apiCall('services.php');
    if (servicesResult.success) {
        const options = servicesResult.services.map(s =>
            `<option value="${s.id}">${escapeHtml(s.name)} (${s.duration_minutes} min - Rs. ${Math.round(s.price)})</option>`
        ).join('');
        serviceSelect.innerHTML = `<option value="">-- Select a service --</option>${options}`;
    }

    // Load stylists into the picker (optional - "Any available stylist" is always the default)
    const stylistGrid = document.getElementById('stylist-grid');
    const stylistsResult = await apiCall('stylists.php');
    let stylistCards = `
        <label class="stylist-option">
            <input type="radio" name="stylist_id" value="" checked>
            <span><span class="stylist-name">Any available stylist</span><span class="stylist-specialty">No preference</span></span>
        </label>
    `;
    if (stylistsResult.success) {
        stylistCards += stylistsResult.stylists.map(s => `
            <label class="stylist-option">
                <input type="radio" name="stylist_id" value="${s.id}">
                <span><span class="stylist-name">${escapeHtml(s.name)}</span><span class="stylist-specialty">${escapeHtml(s.specialty || '')}</span></span>
            </label>
        `).join('');
    }
    stylistGrid.innerHTML = stylistCards;

    // Build the time-slot grid: 9 AM to 5 PM, 30-min steps
    const slotGrid = document.getElementById('slot-grid');
    const slots = [];
    for (let h = 9; h < 17; h++) {
        for (const m of ['00', '30']) {
            slots.push(`${String(h).padStart(2, '0')}:${m}`);
        }
    }
    slotGrid.innerHTML = slots.map(slot => `
        <label class="slot-option">
            <input type="radio" name="appointment_time" value="${slot}" required>
            <span>${formatTime(slot)}</span>
        </label>
    `).join('');

    const form = document.getElementById('book-form');
    const alertBox = document.getElementById('alert-box');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.innerHTML = '';

        const selectedTime = form.querySelector('input[name="appointment_time"]:checked');
        const selectedStylist = form.querySelector('input[name="stylist_id"]:checked');
        const payload = {
            service_id: serviceSelect.value,
            stylist_id: selectedStylist ? selectedStylist.value : '',
            appointment_date: dateInput.value,
            appointment_time: selectedTime ? selectedTime.value : '',
            notes: document.getElementById('notes').value.trim(),
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Booking...';

        const result = await apiCall('appointments.php', 'POST', payload);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm booking';

        if (result.success) {
            showAlert(alertBox, `${escapeHtml(result.message)} <a href="appointments.html">View your appointments</a>.`, 'success');
            form.reset();
        } else {
            showAlert(alertBox, escapeHtml(result.message), 'error');
        }
    });
});

function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
