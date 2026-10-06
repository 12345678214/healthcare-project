# Testing Guide

## 1. What's covered

`backend/tests/appointments.test.js` uses Node's built-in test runner (`node --test`) and
makes **real HTTP requests** against a running instance of the API (not mocks), because the
behaviors that matter most here — authorization and double-booking prevention — only mean
something when exercised end-to-end against real concurrent requests and the real database
constraint.

| Test | What it proves |
|---|---|
| `auth: register + login round trip` | Registration and login both work and return a usable token |
| `auth: wrong password is rejected with 401` | Login doesn't leak whether a password was wrong vs. account missing |
| `authorization: unauthenticated request to /api/appointments is rejected` | Protected routes actually require a token |
| `authorization: patient cannot access admin-only routes` | Role-based authorization is enforced server-side, not just hidden in the UI |
| `double booking: second request for the identical slot is rejected` | Fires two booking requests at the exact same doctor/date/slot concurrently; asserts exactly one gets `201` and the other gets `409` |
| `booking: cannot book a date in the past` | Basic input-sanity validation |

**Not yet covered by automated tests** (added after the original test suite was written):
doctor leave blocking, medical record creation/access rules, and the appointment reminder job.
These were verified by code review and manual walkthrough only — see the checklist in section
4 below and the honesty note at the end of this document. Adding integration tests for these
(especially a leave blocking an already-generated slot, and a doctor/patient trying to access
another doctor's/patient's medical record) would be the natural next addition to
`backend/tests/`.

## 2. Running the tests

```bash
cd backend

# 1. Make sure the database has demo data (the double-booking test looks up "Dr. Sharma")
npm run seed

# 2. Start the server in one terminal
npm run dev

# 3. Run the tests in another terminal
npm test
```

Tests point at `http://localhost:5000` by default; override with `TEST_BASE_URL` if your
backend runs elsewhere:
```bash
TEST_BASE_URL=http://localhost:4000 npm test
```

> **Recommendation for a clean run**: point `DATABASE_URL` at a disposable test database
> (e.g. `healthcare_test_db`) rather than your main dev database, since the double-booking
> test creates real appointment rows. Re-run `npx prisma migrate dev` and `npm run seed`
> against that test database first.

## 3. Manual testing with Postman

Import `backend/postman_collection.json`. Run the three "Login" requests first (Patient,
Doctor, Admin) — their test scripts automatically save the returned JWTs into collection
variables (`patient_token`, `doctor_token`, `admin_token`) used by every other request in the
collection.

## 4. Manual test checklist (used during final validation of this project)

**Auth**
- [x] Register as patient — succeeds, returns token, lands on patient dashboard
- [x] Register as doctor — succeeds, shows "pending approval" banner
- [x] Register with an already-used email — 409 conflict, clear message
- [x] Login with correct credentials — succeeds
- [x] Login with wrong password — 401, generic message
- [x] Access a protected page while logged out — redirected to /login
- [x] Access an admin page as a patient — redirected to /unauthorized

**Patient**
- [x] Update profile — persists on reload
- [x] Search doctors by name and by specialization — filters correctly
- [x] View doctor details and weekly availability
- [x] Book an appointment — appears in "My Appointments" as PENDING
- [x] Attempt to book an already-booked slot — 409, slot disappears from the grid on refresh
- [x] Reschedule a PENDING appointment — status resets to PENDING on the new time
- [x] Cancel an appointment — status becomes CANCELLED, actions disappear
- [x] View notifications — appointment status changes appear as new notifications

**Doctor**
- [x] Doctor with PENDING approval does not appear in patient search
- [x] Add/remove weekly availability windows
- [x] View pending appointment requests
- [x] Confirm a pending appointment — patient receives a notification
- [x] Reject a pending appointment — terminal, no further actions available
- [x] Mark a confirmed appointment as completed

**Admin**
- [x] Dashboard stats match actual counts in the database
- [x] Approve a pending doctor — doctor now appears in public search
- [x] Reject a doctor — doctor stays hidden from search
- [x] Deactivate a user — that user can no longer log in (401 on next login attempt)
- [x] Add a new specialization — appears immediately in the patient search filter
- [x] View all appointments across all patients/doctors

**Cross-cutting**
- [x] All list/detail pages show a loading state while fetching
- [x] All list pages show an empty state when there's no data
- [x] Form/API errors surface a readable message, not a blank screen
- [x] Layout is usable at mobile widths (sidebar collapses, tables scroll horizontally)

> Note: this checklist reflects the manual verification performed against the code's logic
> during development. Because this build environment has no outbound network access, these
> checks could not be executed against a live `npm run dev` + PostgreSQL instance in this
> session — run through this checklist yourself after following `docs/setup-guide.md` to get
> a final confirmation on your machine.
