# GlowBook — Salon Booking System (REST API architecture)

A full-stack **salon appointment booking system**, split cleanly into:

- **`/api/` — PHP + MySQL backend.** Pure JSON API. No HTML is ever generated here.
- **Everything else — static HTML/CSS/JS frontend.** Talks to the API using `fetch()`.

## What makes this a "salon" system (not just generic appointments)
- **Services** are salon treatments: Haircut & Styling, Hair Colouring, Facial Treatment,
  Manicure & Pedicure, Bridal Makeup, Relaxing Spa Massage (all editable/removable from the admin panel).
- **Stylists** — a dedicated feature (this is the unique/bonus part for your assignment):
  the salon owner (admin) can add stylists with a name + specialty (e.g. "Bridal Makeup Artist").
  When a client books, they can pick **"Any available stylist"** or a specific one — and the
  system prevents double-booking the *same stylist* at the *same time*.
- Sidebar/labels use salon language: "Clients" instead of "Users", etc.
- Colour palette: deep wine/aubergine + rose gold — a beauty-salon look, not a generic SaaS template.
- 
## 🌐 Live Demo
[GlowBook](https://glowbook.lovestoblog.com/login.html)

## How it works
1. The browser loads a plain `.html` file (e.g. `dashboard.html`).
2. That page's JS (in `/js/`) calls the API (e.g. `fetch('api/dashboard.php')`).
3. The PHP API reads/writes MySQL and replies with JSON — never HTML.
4. The JS takes that JSON and builds the page content dynamically.

Login state is tracked with a PHP session (cookie). The frontend never manages auth itself —
it just asks the API "am I logged in?" via `api/auth/me.php` on every protected page load.

## Folder structure
```
glowbook-salon/
├── api/                          PHP BACKEND (JSON only)
│   ├── config/db.php             Database connection
│   ├── includes/auth.php         Session helpers, JSON response helper, auth guards
│   ├── auth/
│   │   ├── register.php          POST  → create account
│   │   ├── login.php             POST  → log in
│   │   ├── logout.php            POST  → log out
│   │   └── me.php                GET   → who is logged in right now?
│   ├── services.php              GET/POST/PUT/DELETE → salon services CRUD
│   ├── stylists.php              GET/POST/PUT/DELETE → stylists CRUD  ⭐ new
│   ├── appointments.php          GET/POST/PUT/DELETE → bookings CRUD (with stylist support)
│   ├── users.php                 GET  → admin: list clients
│   └── dashboard.php             GET  → stats for current user/admin
│
├── css/style.css                 Salon-themed styling (wine + rose gold)
├── js/
│   ├── api.js                    fetch() wrapper used by every page
│   ├── layout.js                 Builds the sidebar + protects pages (checks session)
│   ├── login.js / register.js
│   ├── dashboard.js / book.js / appointments.js          (client pages)
│   └── admin-dashboard.js / admin-services.js / admin-stylists.js / admin-appointments.js / admin-users.js
│
├── index.html                    Redirects based on login state
├── login.html / register.html
├── dashboard.html / book.html / appointments.html         (client pages)
├── admin/
│   ├── dashboard.html / services.html / stylists.html / appointments.html / users.html
│
├── database.sql                  Full schema + seed data (salon services + 4 sample stylists)
└── generate_password.php         One-time helper (delete after use)
```

## Setup (step by step)

1. **Copy the whole `glowbook-salon` folder** into your server's web root:
   - XAMPP (Windows): `C:\xampp\htdocs\glowbook-salon`
   - XAMPP (Mac/Linux): `htdocs/glowbook-salon`

2. **Start Apache and MySQL** in XAMPP.

3. **Import the database:**
   - Open `http://localhost/phpmyadmin`
   - Import → choose `database.sql` → Go
   - This creates `salon_booking_system` DB with 6 sample services and 4 sample stylists.

4. **Check DB credentials** in `api/config/db.php` (defaults: user `root`, empty password).

## API reference (for your report)

| Endpoint                  | Method | Auth      | Purpose                                                  |
|----------------------------|--------|-----------|-----------------------------------------------------------|
| `/api/auth/register.php`   | POST   | none      | Create account, logs in automatically                     |
| `/api/auth/login.php`      | POST   | none      | Log in                                                     |
| `/api/auth/logout.php`     | POST   | logged in | Log out                                                    |
| `/api/auth/me.php`         | GET    | none      | Check current session                                      |
| `/api/services.php`        | GET    | logged in | List services (`?all=1` for admin)                          |
| `/api/services.php`        | POST/PUT/DELETE | admin | Create/update/delete a service                        |
| `/api/stylists.php`        | GET    | logged in | List stylists (`?all=1` for admin)                          |
| `/api/stylists.php`        | POST/PUT/DELETE | admin | Create/update/delete a stylist                        |
| `/api/appointments.php`    | GET    | logged in | List bookings (own, or all if admin); `?search=&status=`   |
| `/api/appointments.php`    | POST   | logged in | Book an appointment (service + optional stylist)            |
| `/api/appointments.php`    | PUT    | logged in | Reschedule own booking, or (admin) change status            |
| `/api/appointments.php`    | DELETE | logged in | Cancel a booking (`?id=`)                                    |
| `/api/users.php`           | GET    | admin     | List registered clients                                      |
| `/api/dashboard.php`       | GET    | logged in | Stats for current user/admin                                 |

## Notes for your report / demo
- **Separation of concerns:** PHP only ever returns JSON (`api/`); all HTML/CSS/JS is static and framework-free.
- **Unique feature (stylists):** a second linked entity beyond the basic "service" — a real many-to-one
  relationship (`appointments.stylist_id → stylists.id`), with its own admin CRUD screen and its own
  conflict-checking rule (a stylist can't be double-booked at the same time).
- **Security:** `password_hash()`/`password_verify()`, PDO prepared statements (SQL-injection safe),
  `escapeHtml()` on all rendered data (XSS-safe), session-based auth checked server-side on every API call.
- **Bonus ideas for extra marks:** email confirmation when a booking is confirmed, a calendar view of a
  stylist's day, client reviews/ratings per stylist.
