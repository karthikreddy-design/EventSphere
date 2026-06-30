# EventSphere

A full-stack event management platform for colleges and organizations. EventSphere connects **admins** who create and manage events with **participants** who browse, register, receive QR tickets, and check in at the venue.

**Live demo:** [https://eventsphere-blond.vercel.app](https://eventsphere-blond.vercel.app)  
**Repository:** [https://github.com/karthikreddy-design/EventSphere](https://github.com/karthikreddy-design/EventSphere)

---

## Project Overview

EventSphere is a role-based web application built with **React** and **Supabase**. Admins manage events, track registrations, scan QR attendance, and export reports. Participants discover events, register, manage their profile, and use digital QR tickets for check-in.

The app uses **Supabase Auth** for login, **PostgreSQL** for data, **Storage** for images, and **Row Level Security (RLS)** so users only access data they are allowed to see.

---

## Features

### Admin Dashboard
- Analytics overview (events, participants, attendance charts)
- Create, edit, and delete events with banner images
- Participant management (search, details, export)
- QR code attendance scanner
- PDF and Excel reports (participants, attendance, events)
- Role-specific notifications (new registrations, capacity alerts, check-ins)
- Profile management

### Participant Dashboard
- Browse and filter upcoming events
- Register for events and view event details
- My Events — track registered, upcoming, and completed events
- Digital QR ticket for venue check-in
- Notifications (registration, updates, cancellations, reminders, attendance)
- Profile with photo upload and password change

### Shared
- Secure login and registration
- Real-time notification badge with toast alerts
- Responsive layout (sidebar + navbar)
- Lazy-loaded routes and skeleton loaders

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, React Router 7 |
| UI | Custom CSS, Chart.js, React Toastify |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| QR | react-qr-code, html5-qrcode |
| Reports | jsPDF, xlsx |
| Deployment | Vercel |
| Version control | Git, GitHub |

---

## Folder Structure

```
frontend/src
│
├── assets
├── components
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   ├── DashboardCard.jsx
│   ├── EventCard.jsx
│   ├── QRCodeTicket.jsx
│   └── QRScanner.jsx
│
├── context
├── hooks
├── layouts
│   ├── AdminLayout.jsx
│   └── ParticipantLayout.jsx
│
├── pages
│   ├── admin
│   ├── participant
│   └── common
│
├── routes
├── services
│   ├── authService.js
│   ├── eventService.js
│   ├── registrationService.js
│   ├── attendanceService.js
│   ├── profileService.js
│   └── notificationService.js
│
├── styles
├── supabase
├── utils
└── App.jsx
```

Additional supporting files (e.g. `EventForm.jsx`, `Icon.jsx`, `analyticsService.js`, `reportService.js`) live alongside these core modules in the same folders.

```
EventSphere/
├── README.md
├── .gitignore
└── frontend/
    ├── public/
    ├── src/                    # Structure above
    ├── .env.example
    ├── vercel.json
    ├── package.json
    └── vite.config.js
```

---

## Installation

### Prerequisites
- Node.js 18+ and npm
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone the repository

```bash
git clone https://github.com/karthikreddy-design/EventSphere.git
cd EventSphere/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example file and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find these in **Supabase Dashboard → Project Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Production build (optional)

```bash
npm run build
npm run preview
```

---

## Supabase Setup

### Authentication
- Email/password sign-up and sign-in via `supabase.auth`
- User metadata includes `name` and `role` (`admin` or `participant`)
- Profiles are stored in the `profiles` table linked to `auth.users`
- **Production:** Add your Vercel URL under **Authentication → URL Configuration**:
  - Site URL: `https://eventsphere-blond.vercel.app`
  - Redirect URLs: `https://eventsphere-blond.vercel.app/**`

### Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User name, email, role, phone, department, profile image |
| `events` | Event title, description, category, date, location, capacity, status, image |
| `registrations` | User–event sign-ups, ticket ID, attendance, check-in time |
| `notifications` | In-app alerts for admins and participants |

### Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `event-images` | Event banner uploads |
| `profile-images` | User profile photos |

### RLS Policies (summary)

Row Level Security ensures data isolation:

- **profiles** — Users can read/update their own profile; admins have extended access where configured
- **events** — Public read for participants; admins manage events they create
- **registrations** — Users manage their own registrations; admins view registrations for their events
- **notifications** — Users read/update/delete their own notifications; controlled inserts via policies and `insert_notification` RPC for cross-user alerts (e.g. admin notified on registration)
- **Storage** — Authenticated upload/read policies per bucket

Always verify policies in **Supabase Dashboard → Authentication → Policies** before going to production.

---

## Deployment

### Frontend — Vercel

1. Connect GitHub repo `karthikreddy-design/EventSphere` in [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

7. Deploy — `frontend/vercel.json` handles SPA routing for React Router

**Production URL:** [https://eventsphere-blond.vercel.app](https://eventsphere-blond.vercel.app)

### CLI deploy (alternative)

```bash
cd frontend
npx vercel deploy --prod
```

---

## Testing Checklist

Test the app on multiple screen sizes before release:

| Device | What to verify |
|--------|----------------|
| **Desktop** | Full sidebar, charts, tables, QR scanner, reports export |
| **Laptop** | Layout, event cards, participant modal, notifications |
| **Tablet** | Sidebar toggle, responsive grids, forms |
| **Mobile** | Hamburger menu, login, browse events, QR ticket display |

### Functional tests
- [ ] Register and login (admin + participant)
- [ ] Admin: create event with image, edit, delete
- [ ] Participant: browse, register, view QR ticket
- [ ] Admin: scan QR and mark attendance
- [ ] Notifications: receive, mark read, delete
- [ ] Profile: update details and upload photo
- [ ] Reports: export PDF and Excel
- [ ] Deployed site: login works with Supabase redirect URLs configured

---

## Future Improvements

- **Paid events** — Ticket pricing and revenue tracking (dashboard placeholder exists)
- **Email notifications** — Supabase Edge Functions or third-party email for reminders
- **Event waitlist** — When events reach max capacity
- **Multi-admin / organizations** — Separate event owners per department
- **Calendar view** — Visual schedule for participants
- **PWA / offline QR** — Cache tickets for poor network at venues
- **Audit logs** — Track admin actions on events and registrations
- **Automated tests** — Unit and E2E tests (Vitest, Playwright)
- **TypeScript migration** — Stronger type safety across services
- **Dark mode** — Theme toggle for dashboards

---

## License

This project is for educational and portfolio use. Adjust licensing as needed for your organization.

---

## Author

**Karthik Reddy** — [GitHub](https://github.com/karthikreddy-design)
