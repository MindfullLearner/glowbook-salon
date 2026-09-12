/**
 * layout.js — renders the sidebar for logged-in pages and protects them.
 *
 * Usage on a protected page:
 *   <div id="sidebar-placeholder"></div>
 *   <script>window.API_BASE = 'api';</script>  <!-- or '../api' for /admin pages -->
 *   <script src="js/api.js"></script>
 *   <script src="js/layout.js"></script>
 *   <script>initLayout({ adminOnly: false, activePage: 'dashboard' });</script>
 */

async function initLayout({ adminOnly = false, activePage = '' } = {}) {
    const result = await apiCall('auth/me.php');

    if (!result.loggedIn) {
        window.location.href = pathToRoot() + 'login.html';
        return null;
    }
    if (adminOnly && result.user.role !== 'admin') {
        window.location.href = pathToRoot() + 'dashboard.html';
        return null;
    }
    // A normal user should never sit on an admin page, and vice versa for dashboard landing
    if (!adminOnly && result.user.role === 'admin' && activePage === 'dashboard') {
        window.location.href = pathToRoot() + 'admin/dashboard.html';
        return null;
    }

    renderSidebar(result.user, activePage);
    return result.user;
}

function renderSidebar(user, activePage) {
    const root = pathToRoot();
    const isAdmin = user.role === 'admin';

    const userLinks = `
        <a href="${root}dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">My Dashboard</a>
        <a href="${root}book.html" class="${activePage === 'book' ? 'active' : ''}">Book Appointment</a>
        <a href="${root}appointments.html" class="${activePage === 'appointments' ? 'active' : ''}">My Appointments</a>
    `;

    const adminLinks = `
        <a href="${root}admin/dashboard.html" class="${activePage === 'admin-dashboard' ? 'active' : ''}">Overview</a>
        <a href="${root}admin/appointments.html" class="${activePage === 'admin-appointments' ? 'active' : ''}">All Appointments</a>
        <a href="${root}admin/services.html" class="${activePage === 'admin-services' ? 'active' : ''}">Services</a>
        <a href="${root}admin/stylists.html" class="${activePage === 'admin-stylists' ? 'active' : ''}">Stylists</a>
        <a href="${root}admin/users.html" class="${activePage === 'admin-users' ? 'active' : ''}">Clients</a>
    `;

    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    placeholder.outerHTML = `
        <aside class="sidebar">
            <div class="sidebar-brand">Glow<span>Book</span></div>
            <nav class="sidebar-nav">${isAdmin ? adminLinks : userLinks}</nav>
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div>
                    <div>
                        <div class="sidebar-user-name">${escapeHtml(user.name)}</div>
                        <div class="sidebar-user-role">${escapeHtml(user.role)}</div>
                    </div>
                </div>
                <a href="#" class="logout-link" id="logout-link">Log out</a>
            </div>
        </aside>
    `;

    document.getElementById('logout-link').addEventListener('click', async (e) => {
        e.preventDefault();
        await apiCall('auth/logout.php', 'POST');
        window.location.href = root + 'login.html';
    });
}
