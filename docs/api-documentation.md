# API Documentation

Base URL (local): `http://localhost:5000/api`

Every response follows this envelope:
```json
{ "success": true, "message": "Human-readable message", "data": { ... } }
{ "success": false, "message": "Human-readable message", "errors": [ ... ] }
```

Protected routes require header: `Authorization: Bearer <token>`

---

## Auth

### `POST /auth/register`
Public. Body:
```json
{ "email": "a@b.com", "password": "min6chars", "role": "PATIENT", "fullName": "Jane Doe", "phone": "9800000000" }
```
`role` must be `PATIENT` or `DOCTOR` (admin accounts are seeded, not self-registered). A
doctor registering this way starts with `approvalStatus: PENDING` and won't appear in public
search until an admin approves them.
Response `201`: `{ user, token }`

### `POST /auth/login`
Public. Body: `{ "email": "...", "password": "..." }`
Response `200`: `{ user, token }`. Returns `401` for wrong email/password (deliberately the
same generic message either way, to avoid leaking which emails are registered).

### `GET /auth/me`
Auth required. Returns the current user (with `patient`/`doctor` profile if applicable).

---

## Doctors (public)

### `GET /doctors?search=&specializationId=`
Public. Lists **approved** doctors only. Optional `search` (name, case-insensitive) and
`specializationId` filters.

### `GET /doctors/:id`
Public. Full profile of one approved doctor, including their weekly availability.

### `GET /doctors/:id/availability?date=YYYY-MM-DD`
Public. Returns free time slots for that doctor on that specific date (already excludes
booked/past slots **and dates covered by an active leave**). Response:
`{ "date": "...", "slots": [...], "onLeave": false }` — when `onLeave` is `true`, `slots` is
always empty and the `message` field explains the doctor is on leave (with reason if given).
Rejects past dates with `400`.

## Doctors (doctor-only, own account)

### `GET /doctors/profile` · `PUT /doctors/profile`
Auth required, role `DOCTOR`. Get/update own profile (bio, experience, fee, qualifications,
`specializationIds` array).

### `GET /doctors/availability` · `POST /doctors/availability` · `DELETE /doctors/availability/:id`
Auth required, role `DOCTOR`. Manage own weekly recurring availability windows.
`POST` body: `{ "dayOfWeek": 1, "startTime": "09:00", "endTime": "13:00", "slotDurationMinutes": 30 }`
(`dayOfWeek`: 0=Sunday … 6=Saturday)

### `GET /doctors/leaves` · `POST /doctors/leaves` · `DELETE /doctors/leaves/:id`
Auth required, role `DOCTOR`. Manage one-off leave/holiday date ranges, which override the
weekly availability pattern for those dates — see `docs/appointment-flow.md` section 7.
`GET` returns `{ upcoming, past }` (split by whether the leave's end date has passed).
`POST` body: `{ "startDate": "2026-09-10", "endDate": "2026-09-12", "reason": "optional" }`
(`endDate` defaults to `startDate` if omitted, for a single-day leave). Rejects overlapping
leave ranges with `409`, and rejects a past `startDate` with `400`. If existing
`PENDING`/`CONFIRMED` appointments fall inside the new leave range, the doctor receives an
in-app notification listing the conflict count — those appointments are **not**
auto-cancelled.

---

## Patients (patient-only, own account)

### `GET /patients/profile` · `PUT /patients/profile`
Auth required, role `PATIENT`. Get/update own profile.

### `GET /patients/appointments`
Auth required, role `PATIENT`. Convenience alias for `GET /appointments` scoped to self.

---

## Appointments

All routes below require authentication. Role-aware behavior is noted per route.

### `POST /appointments`
Role `PATIENT`. Body:
```json
{ "doctorId": "uuid", "appointmentDate": "2026-09-01", "startTime": "09:00", "reasonForVisit": "optional text" }
```
Creates a `PENDING` appointment. Returns `409` if the slot is no longer free (including the
race-condition case — see `docs/appointment-flow.md`). Returns `400` for a past date.

### `GET /appointments?status=`
Any role. Patients see only their own appointments; doctors see only their own; admins see
all. Optional `status` filter (`PENDING`/`CONFIRMED`/`COMPLETED`/`CANCELLED`/`REJECTED`).

### `GET /appointments/:id`
Any role, but access is checked: patients/doctors can only fetch their own appointment;
admins can fetch any. Returns `403` otherwise.

### `PUT /appointments/:id`
Reschedule. Body: `{ "appointmentDate": "...", "startTime": "..." }`. Only the owning
patient/doctor or an admin may reschedule; only while status is `PENDING` or `CONFIRMED`.
Resets status to `PENDING` (re-confirmation required).

### `PATCH /appointments/:id/cancel`
Cancels the appointment (sets status to `CANCELLED`). Same ownership rule as above.

### `PATCH /appointments/:id/status`
Role `DOCTOR` (own appointments) or `ADMIN`. Body: `{ "status": "CONFIRMED" | "REJECTED" | "COMPLETED" }`.
This is how a doctor accepts/rejects a request or marks a visit complete.

---

## Specializations (public)

### `GET /specializations`
Public. Lists all specializations — used to populate the doctor-search filter for everyone,
logged in or not.

---

## Admin

All routes below require role `ADMIN`.

### `GET /admin/dashboard`
Returns `{ totalPatients, totalDoctors, totalAppointments, pendingAppointments, pendingDoctorApprovals }`.

### `GET /admin/users`
Lists every user (safe fields only — no password hashes).

### `GET /admin/doctors`
Lists every doctor (all approval statuses), including specializations and account email.

### `GET /admin/patients`
Lists every patient.

### `GET /admin/appointments?status=`
Lists every appointment in the system, optional status filter.

### `PATCH /admin/doctors/:id/status`
Body: `{ "status": "APPROVED" | "REJECTED" | "PENDING" }`. Approves/rejects a doctor account.
Writes an audit log entry and sends the doctor an in-app notification.

### `PATCH /admin/users/:id/status`
Body: `{ "isActive": true|false }`. Activates/deactivates any non-admin user account.

### `POST /admin/specializations`
Body: `{ "name": "...", "description": "..." }`. Creates a new specialization/department.

### `GET /admin/activity`
Returns the last 100 audit log entries (who did what, when).

---

## Medical Records

All routes below require authentication.

### `POST /medical-records`
Role `DOCTOR` (must be the treating doctor) or `ADMIN`. Creates the record if none exists for
the given appointment, or updates it (replacing the prescription list) if one already exists —
one record per appointment, enforced by a unique constraint. Requires the appointment's status
to be `COMPLETED` (`400` otherwise). Body:
```json
{
  "appointmentId": "uuid",
  "diagnosis": "optional",
  "symptoms": "optional",
  "doctorNotes": "optional",
  "followUpDate": "2026-09-10",
  "medicines": [{ "medicineName": "Paracetamol", "dosage": "650mg", "instructions": "Twice daily after food" }]
}
```

### `GET /medical-records`
Role-aware: patients see their own records, doctors see records they authored, admins see all.

### `GET /medical-records/:id`
Access checked the same way as appointments — owning patient, owning doctor, or admin only
(`403` otherwise).

---

## Notifications

All routes below require authentication (any role).

### `GET /notifications`
Own notifications, newest first.

### `PATCH /notifications/:id/read`
Marks one notification as read.

### `PATCH /notifications/read-all`
Marks all of the current user's notifications as read.

---

## Standard error status codes

| Code | Meaning |
|---|---|
| 400 | Bad request (e.g. past date, invalid status value) |
| 401 | Not authenticated / invalid or expired token |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, slot already booked) |
| 422 | Request body failed validation (see `errors` array for field-level detail) |
| 429 | Too many requests (rate limited) |
| 500 | Unexpected server error |

A ready-to-import Postman collection covering all of the above is at
`backend/postman_collection.json`.
