# MediCare Connect — Healthcare Appointment Management System

A full-stack healthcare appointment booking platform built with **React (Vite + Tailwind)**,
**Node.js/Express**, **PostgreSQL**, and **Prisma ORM**. Patients search for doctors and book
appointments against real-time availability; doctors manage their schedule and confirm/complete
visits; admins oversee the whole platform.

> **Portfolio/demo project.** This is not a production medical system and is not
> HIPAA/GDPR compliant. Do not store real patient data in it.

---

## 1. Features

**Patients** — register/login, manage profile, search & filter doctors, view doctor
availability, book/reschedule/cancel appointments, view upcoming/past appointments, receive
in-app **and email** notifications (appointment confirmed/rejected/cancelled, plus 24-hour and
1-hour reminders before a visit), view their medical records after a completed visit.

**Doctors** — register (pending admin approval)/login, manage profile (bio, experience,
qualifications, fee, specializations), set weekly availability windows, **add/view/cancel
leave or holiday dates** (patients cannot book during a doctor's leave), view & confirm/reject/
complete appointments, and **add a medical record (diagnosis, symptoms, notes, prescription)**
once a visit is marked completed.

**Admins** — dashboard with system-wide stats, approve/reject doctor accounts, activate/
deactivate any user, manage specializations/departments, view all appointments, view a system
activity/audit log.

The seeded demo data includes **20 doctors** across a broad range of specializations
(Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, Gynecology, ENT, Ophthalmology,
Dentistry, Psychiatry, Gastroenterology, Pulmonology, Urology, Endocrinology, Oncology,
Nephrology, Radiology, Surgery, Physiotherapy, and General Medicine).

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js, REST API |
| Auth | JWT, bcrypt password hashing |
| Database | PostgreSQL |
| ORM | Prisma |
| Other | dotenv, CORS, helmet, express-validator, express-rate-limit, morgan |
| Email | nodemailer (SMTP, with a console-log fallback if unconfigured) |
| Scheduling | node-cron (appointment reminder sweep) |

Plain JavaScript was used throughout (no TypeScript) — the project is small enough that
TypeScript's tooling overhead wasn't worth it for an interview/portfolio project; the tradeoff
is documented in `docs/TECHNICAL_CONCEPTS.md`.

## 3. Folder Structure

```
healthcare-appointment-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full database schema
│   │   └── seed.js             # Demo data
│   ├── src/
│   │   ├── config/             # env + Prisma client
│   │   ├── middleware/         # auth, validation, error handling
│   │   ├── utils/               # JWT, API response helpers, slot logic
│   │   ├── validators/          # express-validator rule sets
│   │   ├── controllers/         # business logic per module (incl. doctorLeave, medicalRecord)
│   │   ├── routes/              # Express routers per module
│   │   ├── jobs/                # background jobs (reminderJob.js, node-cron)
│   │   ├── app.js               # Express app assembly
│   │   └── server.js            # entry point (starts the reminder job)
│   ├── tests/                   # integration tests (incl. double-booking race test)
│   ├── postman_collection.json
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios service layer
│   │   ├── context/              # AuthContext
│   │   ├── components/           # shared UI (Navbar, DashboardLayout, etc.)
│   │   ├── pages/
│   │   │   ├── public/            # Home, Doctors, Login, Register, ...
│   │   │   ├── patient/           # Dashboard, Book, My Appointments, ...
│   │   │   ├── doctor/            # Dashboard, Availability, Appointments, ...
│   │   │   └── admin/             # Dashboard, Doctors, Users, ...
│   │   ├── App.jsx                # route definitions
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── docs/                          # architecture, API, flows, interview prep
├── README.md
└── .gitignore
```

## 4. Architecture (short version)

Browser (React SPA) → Axios (JWT in `Authorization` header) → Express REST API → Prisma
Client → PostgreSQL. See `docs/system-architecture.md` for the full diagram and explanation,
and `docs/database-design.md` for the ER diagram and every table's purpose.

## 5. Installation & Setup

### Prerequisites
- Node.js 18+
- npm
- A running PostgreSQL instance (local install, Docker, or a cloud provider)

### 5.1 Clone & install
```bash
cd healthcare-appointment-system

cd backend
npm install

cd ../frontend
npm install
```

### 5.2 Configure environment variables
```bash
# backend
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string, and JWT_SECRET

# frontend
cd ../frontend
cp .env.example .env
# defaults to http://localhost:5000/api, adjust if your backend runs elsewhere
```

### 5.3 Database setup
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init   # creates tables from schema.prisma
npm run seed                         # loads demo doctors/patients/admin
```

### 5.4 Run locally
```bash
# terminal 1
cd backend
npm run dev            # http://localhost:5000

# terminal 2
cd frontend
npm run dev             # http://localhost:5173
```

Open http://localhost:5173 in your browser.

## 6. Demo Credentials

All seeded accounts use the password: **`Password@123`**

| Role | Email |
|---|---|
| Admin | admin@healthcare.demo |
| Doctor (approved, 20 total) | e.g. dr.sharma@healthcare.demo (Cardiology), dr.mehta@healthcare.demo (Dermatology), dr.singh@healthcare.demo (Orthopedics, has a sample leave 7-9 days out) — see `backend/prisma/seed.js` for the full list of 20 |
| Doctor (pending approval) | dr.pending@healthcare.demo |
| Patient | patient1@healthcare.demo (has a completed appointment with a sample medical record) |
| Patient | patient2@healthcare.demo |

## 7. Testing

```bash
cd backend
npm run seed              # ensure demo data exists
npm run dev                # server must be running in another terminal
npm test                   # runs tests/appointments.test.js against the live API
```

See `docs/testing-guide.md` for what each test covers, including the concurrent
double-booking test.

Import `backend/postman_collection.json` into Postman for manual API exploration.

## 8. Deployment

See `docs/deployment-guide.md` for step-by-step instructions (Vercel for frontend,
Render/Railway for backend, a managed Postgres provider for the database).

## 9. Environment Variables Reference

**backend/.env**
| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs — must be long & random |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API rate limiting |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Email delivery credentials. **If left blank, emails are logged to the console instead of sent** — the app never crashes or blocks an action because email isn't configured. See section 9a below for how to configure a real provider. |
| `EMAIL_FROM` | The "from" address/name used on outgoing emails |
| `ENABLE_REMINDER_CRON` | Set to `false` to disable the background appointment-reminder job entirely (useful for tests) |
| `REMINDER_CRON_SCHEDULE` | Cron expression controlling how often the reminder job checks for due reminders (default: every 5 minutes) |

**frontend/.env**
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |

## 9a. Configuring email delivery

By default (no SMTP variables set), the app logs what *would* have been sent to the backend
console — this keeps the whole appointment lifecycle runnable with zero external setup. To
send real emails:

1. Get SMTP credentials from any provider (Gmail App Passwords, SendGrid, Mailtrap for
   testing, etc.).
2. Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true` for port 465, `false` for 587),
   `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` in `backend/.env`.
3. Restart the backend. No code changes needed — `src/utils/email.js` automatically switches
   from the console fallback to real SMTP delivery once credentials are present.
4. Emails are sent for: appointment confirmed, appointment rejected, appointment cancelled,
   and the 24-hour/1-hour appointment reminders. See `docs/appointment-flow.md` for exactly
   when each fires.

## 10. Documentation Index

- `docs/system-architecture.md` — full architecture + diagrams
- `docs/database-design.md` — ER diagram, table-by-table rationale
- `docs/api-documentation.md` — every endpoint, request/response shapes
- `docs/authentication-flow.md` — JWT + role-based auth walkthrough
- `docs/appointment-flow.md` — booking logic, double-booking prevention, leave blocking, reminders
- `docs/setup-guide.md` — detailed local setup
- `docs/testing-guide.md` — how to run and interpret tests
- `docs/deployment-guide.md` — production deployment steps
- `docs/INTERVIEW_NOTES.md` — plain-English project walkthrough
- `docs/INTERVIEW_QA.md` — 100+ interview Q&A
- `docs/PROJECT_EXPLANATION.md` — 30s / 1min / 2min / 5min pitch scripts
- `docs/TECHNICAL_CONCEPTS.md` — beginner-friendly concept glossary

## 11. Known Limitations

- Not HIPAA/GDPR compliant — demo project only.
- No SMS delivery — only email and in-app notifications.
- No payment integration for consultation fees.
- Reminder timing is "best-effort" rather than exact: the reminder job fires a "24 hours
  before" or "1 hour before" email the first time it notices the appointment has entered that
  window, not at a precise instant. If a doctor confirms a booking only hours before the
  visit, both reminders may fire in quick succession rather than 24 hours apart. See
  `docs/appointment-flow.md` for the full explanation.
- No automated frontend test suite (backend has integration tests).
- No file/document upload for medical records or prescriptions (structured text/prescription
  fields only, no scans or PDFs).
- Doctor leave is a manually-entered date range with no recurring pattern (e.g. no "every
  Friday off" — that's what the weekly `DoctorAvailability` pattern is for).

## 12. Future Improvements

- SMS appointment reminders alongside email.
- Recurring/partial-day leave patterns for doctors.
- Payment gateway integration.
- Video consultation support.
- File/PDF upload for medical records and prescriptions.
- Admin analytics charts (appointments over time, doctor utilization).
- A real job queue (e.g. BullMQ) instead of a simple cron sweep, for more precise and
  scalable reminder delivery.

## Portfolio Upgrade — 2026 UI/UX

This version includes a redesigned healthcare product experience while preserving the existing REST API, Prisma data model, authentication and booking engine.

### Added / upgraded
- Premium responsive healthcare landing page and doctor directory
- Doctor profile experience with next-slot preview and availability presentation
- Four-step appointment booking flow with live slot checking
- Patient dashboard with care overview, quick actions and appointment timeline
- Patient appointment List/Calendar views
- Doctor dashboard with schedule, pending requests and clinical tools
- Admin command center with KPI cards, operations chart, attention queue and audit activity
- Digital medical-record presentation with browser Print / Save as PDF workflow
- MediCare Assist smart care-navigation assistant (general guidance only; not a diagnosis tool)
- Dark mode with persisted preference
- Mobile-first responsive layouts
- Consistent cards, badges, navigation, empty states and accessibility-friendly controls

### Run
1. Configure `backend/.env` from `backend/.env.example` with a PostgreSQL `DATABASE_URL` and JWT secret.
2. From `backend`: `npm install`, `npx prisma generate`, `npx prisma migrate dev`, `npm run seed`, `npm run dev`.
3. From `frontend`: `npm install`, `npm run dev`.
4. Open the Vite URL shown by the frontend terminal (usually `http://localhost:5173`).

### Safety note
This is a portfolio/demo system. Do not use it for real patient medical data. The assistant provides general navigation guidance and is not a medical diagnosis service.
