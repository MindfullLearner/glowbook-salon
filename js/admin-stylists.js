document.addEventListener('DOMContentLoaded', async () => {
    const user = await initLayout({ adminOnly: true, activePage: 'admin-stylists' });
    if (!user) return;

    const container = document.getElementById('stylists-container');
    const alertBox = document.getElementById('alert-box');
    const form = document.getElementById('stylist-form');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    const idInput = document.getElementById('stylist_id');
    const nameInput = document.getElementById('name');
    const specialtyInput = document.getElementById('specialty');
    const activeInput = document.getElementById('is_active');

    async function loadStylists() {
        const result = await apiCall('stylists.php?all=1');
        if (!result.success) {
            showAlert(container, escapeHtml(result.message), 'error');
            return;
        }
        renderTable(result.stylists);
    }

    function renderTable(stylists) {
        if (stylists.length === 0) {
            container.innerHTML = `<p class="empty-state">No stylists yet. Add one on the left.</p>`;
            return;
        }
        const rows = stylists.map(s => `
            <tr>
                <td>${escapeHtml(s.name)}</td>
                <td>${escapeHtml(s.specialty || '—')}</td>
                <td><span class="badge ${s.is_active == 1 ? 'badge-confirmed' : 'badge-cancelled'}">${s.is_active == 1 ? 'Active' : 'Hidden'}</span></td>
                <td class="actions-cell">
                    <button type="button" class="btn-link" data-edit="${s.id}">Edit</button>
                    <button type="button" class="btn-link danger" data-delete="${s.id}">Remove</button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Name</th><th>Specialty</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const stylist = stylists.find(s => s.id == btn.dataset.edit);
                startEdit(stylist);
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Remove this stylist? Existing appointments will show "any available stylist" instead.')) return;
                const result = await apiCall(`stylists.php?id=${btn.dataset.delete}`, 'DELETE');
                if (result.success) {
                    showAlert(alertBox, escapeHtml(result.message), 'success');
                    loadStylists();
                } else {
                    showAlert(alertBox, escapeHtml(result.message), 'error');
                }
            });
        });
    }

    function startEdit(stylist) {
        idInput.value = stylist.id;
        nameInput.value = stylist.name;
        specialtyInput.value = stylist.specialty || '';
        activeInput.checked = stylist.is_active == 1;

        formTitle.textContent = 'Edit stylist';
        submitBtn.textContent = 'Update stylist';
        cancelEditBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        idInput.value = '';
        form.reset();
        activeInput.checked = true;
        formTitle.textContent = 'Add new stylist';
        submitBtn.textContent = 'Add stylist';
        cancelEditBtn.style.display = 'none';
    }

    cancelEditBtn.addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.innerHTML = '';

        const payload = {
            name: nameInput.value.trim(),
            specialty: specialtyInput.value.trim(),
            is_active: activeInput.checked,
        };

        let result;
        if (idInput.value) {
            payload.id = idInput.value;
            result = await apiCall('stylists.php', 'PUT', payload);
        } else {
            result = await apiCall('stylists.php', 'POST', payload);
        }

        if (result.success) {
            showAlert(alertBox, escapeHtml(result.message), 'success');
            resetForm();
            loadStylists();
        } else {
            showAlert(alertBox, escapeHtml(result.message), 'error');
        }
    });

    loadStylists();
});
