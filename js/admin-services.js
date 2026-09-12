document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: true, activePage: 'admin-services' });
    if (!user) return;

    const container = document.getElementById('services-container');
    const alertBox = document.getElementById('alert-box');
    const form = document.getElementById('service-form');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    const idInput = document.getElementById('service_id');
    const nameInput = document.getElementById('name');
    const descInput = document.getElementById('description');
    const durationInput = document.getElementById('duration_minutes');
    const priceInput = document.getElementById('price');
    const activeInput = document.getElementById('is_active');

    async function loadServices() {
        const result = await apiCall('services.php?all=1');
        if (!result.success) {
            showAlert(container, escapeHtml(result.message), 'error');
            return;
        }
        renderTable(result.services);
    }

    function renderTable(services) {
        if (services.length === 0) {
            container.innerHTML = `<p class="empty-state">No services yet. Add one on the left.</p>`;
            return;
        }
        const rows = services.map(s => `
            <tr>
                <td>${escapeHtml(s.name)}</td>
                <td>${s.duration_minutes} min</td>
                <td>Rs. ${Math.round(s.price)}</td>
                <td><span class="badge ${s.is_active == 1 ? 'badge-confirmed' : 'badge-cancelled'}">${s.is_active == 1 ? 'Active' : 'Hidden'}</span></td>
                <td class="actions-cell">
                    <button type="button" class="btn-link" data-edit="${s.id}">Edit</button>
                    <button type="button" class="btn-link danger" data-delete="${s.id}">Delete</button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Name</th><th>Duration</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = services.find(s => s.id == btn.dataset.edit);
                startEdit(service);
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this service? This cannot be undone.')) return;
                const result = await apiCall(`services.php?id=${btn.dataset.delete}`, 'DELETE');
                if (result.success) {
                    showAlert(alertBox, escapeHtml(result.message), 'success');
                    loadServices();
                } else {
                    showAlert(alertBox, escapeHtml(result.message), 'error');
                }
            });
        });
    }

    function startEdit(service) {
        idInput.value = service.id;
        nameInput.value = service.name;
        descInput.value = service.description || '';
        durationInput.value = service.duration_minutes;
        priceInput.value = service.price;
        activeInput.checked = service.is_active == 1;

        formTitle.textContent = 'Edit service';
        submitBtn.textContent = 'Update service';
        cancelEditBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        idInput.value = '';
        form.reset();
        durationInput.value = 30;
        priceInput.value = 0;
        activeInput.checked = true;
        formTitle.textContent = 'Add new service';
        submitBtn.textContent = 'Add service';
        cancelEditBtn.style.display = 'none';
    }

    cancelEditBtn.addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.innerHTML = '';

        const payload = {
            name: nameInput.value.trim(),
            description: descInput.value.trim(),
            duration_minutes: durationInput.value,
            price: priceInput.value,
            is_active: activeInput.checked,
        };

        let result;
        if (idInput.value) {
            payload.id = idInput.value;
            result = await apiCall('services.php', 'PUT', payload);
        } else {
            result = await apiCall('services.php', 'POST', payload);
        }

        if (result.success) {
            showAlert(alertBox, escapeHtml(result.message), 'success');
            resetForm();
            loadServices();
        } else {
            showAlert(alertBox, escapeHtml(result.message), 'error');
        }
    });

    loadServices();
});
