# Interview Questions & Answers (100+)

Format per question: **direct answer**, then a bit more depth, then an example where useful.
Follow-up "gotcha" questions are included where an interviewer is likely to push further.

---

## A. Project Introduction

**1. What is this project?**
A full-stack healthcare appointment booking platform with three roles — patient, doctor,
admin — built with React, Express, and PostgreSQL/Prisma.
*Deeper:* It covers the full loop: doctor discovery, real-time availability, booking,
confirmation, and lifecycle management (reschedule/cancel/complete), plus admin oversight.

**2. Why did you build this project?**
To demonstrate a complete, realistic full-stack workflow — not just CRUD, but a feature
(appointment booking) that has genuine business logic and a concurrency problem worth solving
properly.

**3. What was the hardest part?**
Preventing double booking under concurrent requests — getting the database-level unique
constraint right and proving it with a real concurrent test, rather than just trusting an
application-level check.

**4. Who is the target user?**
Patients looking to book a doctor online, doctors who want to manage their own schedule
digitally, and a clinic/platform admin overseeing both.

**5. Is this a real production system?**
No — it's explicitly a portfolio/demo project. It's not HIPAA or GDPR compliant and shouldn't
store real patient data.

**6. How long did it take to build?**
*(Answer this honestly based on your own timeline — interviewers ask this to gauge realistic
pacing, not to catch you out.)*

**7. What would you do differently if you started over?**
I'd consider TypeScript from day one for the extra safety on larger data shapes, and I'd
design the doctor-availability model to support one-off exceptions (holidays) from the start
rather than as a later addition.

---

## B. Project Architecture

**8. Describe the overall architecture.**
A modular monolith: one React SPA, one Express REST API, one PostgreSQL database via Prisma.
No microservices — unnecessary complexity for this scope.

**9. Why not microservices?**
Microservices solve organizational and independent-scaling problems that a project this size
doesn't have. A single well-structured backend is easier to build, test, deploy, and reason
about.

**10. Walk me through what happens when a patient books an appointment.**
Frontend sends `POST /api/appointments` with the JWT attached → `authenticate` middleware
verifies the token and loads the user → `authorize("PATIENT")` checks the role → validators
check the request shape → the controller re-checks slot availability server-side → inserts the
row (protected by a unique constraint) → creates a notification for the doctor → returns the
created appointment.

**11. How are frontend and backend separated?**
Completely — the frontend never touches the database directly; every data operation goes
through a versioned REST API over HTTP, authenticated with a JWT.

**12. What's your folder structure and why?**
Backend: routes/middleware/controllers/validators/utils/config, each with one responsibility.
Frontend: api/context/components/pages, split further by role (patient/doctor/admin/public).
This separation of concerns makes it easy to find and change one thing without touching
unrelated code.

**13. How would this scale to more traffic?**
The backend is stateless (JWT-based auth, no server-side sessions), so you could run multiple
instances behind a load balancer without any session-affinity concerns. The database would
likely be the first bottleneck — read replicas or caching (e.g. cached doctor lists) would be
the next step.

**14. What's a modular monolith?**
A single deployable application that's internally organized into clear, loosely-coupled
modules (auth, appointments, admin, etc.) — you get the maintainability benefits of clean
separation without the operational overhead of running many separate services.

---

## C. Frontend

**15. Why React?**
Component reuse and a large ecosystem. Components like `StatusBadge` and `DashboardLayout` are
written once and used across dozens of pages.

**16. How is routing handled?**
React Router, with routes defined in `App.jsx`, grouped by role and wrapped in
`<ProtectedRoute roles={[...]}>` for anything requiring authentication.

**17. How does the app stay responsive on mobile?**
Tailwind's responsive utility classes (`sm:`, `md:`, `lg:`) throughout; the dashboard sidebar
collapses on small screens, tables scroll horizontally, and the navbar collapses into a
hamburger-style menu.

**18. How do you handle loading/error/empty states?**
Shared components (`LoadingSpinner`, `ErrorMessage`, `EmptyState`) used consistently across
every page that fetches data, instead of ad hoc handling per page.

**19. How is styling done?**
Tailwind CSS utility classes, plus a handful of reusable semantic classes (`.btn-primary`,
`.card`, `.input`) defined once to avoid repeating long class lists.

**20. How does the frontend know if a user is logged in?**
`AuthContext` holds the current user in React state, initialized from `localStorage` on load,
so a page refresh doesn't log the user out.

---

## D. React (deep dive)

**21. What are React hooks, and which did you use?**
Functions that let function components use state and side effects. `useState` for local
component state (e.g. form fields, selected slot), `useEffect` for data fetching when a
component mounts or a dependency changes, `useContext` for reading `AuthContext`.

**22. Why function components instead of class components?**
Function components with hooks are the modern standard — less boilerplate, easier to read and
test, and what the React docs and ecosystem now recommend by default.

**23. How do you avoid prop-drilling for auth state?**
`AuthContext` — created once, provided at the top of the app in `main.jsx`, and consumed
anywhere with `useAuth()` instead of passing the user down through every component manually.

**24. Explain the `useEffect` dependency array with a project example.**
In `BookAppointment.jsx`, `useEffect(() => { ...fetch slots... }, [doctorId, selectedDate])`
re-runs whenever the doctor or selected date changes, so the slot grid always reflects the
currently selected date.

**25. How do you prevent unnecessary re-renders here?**
The project doesn't need heavy optimization (no huge lists or expensive renders), so it
intentionally keeps things simple rather than prematurely adding `useMemo`/`useCallback`
everywhere — that would be over-engineering for this scale.

**26. What's a controlled component? Give an example.**
An input whose value is driven by React state rather than the DOM. Every form field in this
project (`<input value={form.email} onChange={...}>`) is controlled — this makes validation
and submission straightforward since the current values always live in one place.

---

## E. Backend

**27. Why Node.js/Express?**
JavaScript across the whole stack keeps context-switching low, and Express is a minimal,
well-understood framework that's easy to structure cleanly for a REST API of this size.

**28. What does `asyncHandler` do and why does it exist?**
It wraps an async route handler so any thrown or rejected error is automatically passed to
Express's error-handling middleware, instead of requiring a `try/catch` in every single
controller function.

**29. How is configuration managed?**
Environment variables loaded via `dotenv`, read once in `config/env.js`, which throws clearly
at startup if a required variable is missing — failing fast instead of failing confusingly
later.

**30. How is the Prisma client shared across the app?**
A single instance is created once in `config/db.js` and imported everywhere it's needed, so
the app doesn't open a new database connection pool per request.

**31. What happens if the database is unreachable at startup?**
`server.js` calls `prisma.$connect()` before starting to listen; if that fails, it logs the
error and exits the process rather than starting a server that can't actually serve requests.

---

## F. Node.js

**32. What is the event loop, briefly?**
Node.js runs JavaScript on a single thread but handles I/O (database calls, file access,
network requests) asynchronously — it doesn't block waiting for them; instead it registers a
callback and moves on, then comes back to that callback when the I/O completes.

**33. Why is this relevant to Express apps?**
It's why a single Node process can handle many concurrent HTTP requests efficiently — as long
as your code doesn't do long synchronous/blocking work, which would stall every other request.

**34. What's the difference between `require` and `import`?**
`require` is CommonJS (Node's original module system, synchronous, used throughout this
backend). `import`/`export` is the ES Modules standard (used in the frontend, since Vite
supports it natively). This project's backend intentionally uses CommonJS for simplicity and
broad compatibility with the Node ecosystem's tooling.

---

## G. Express.js

**35. What is middleware in Express?**
A function `(req, res, next)` that runs before the final route handler — used here for
security headers (`helmet`), CORS, JSON body parsing, authentication, and centralized error
handling.

**36. How does error-handling middleware differ from regular middleware?**
It takes four arguments `(err, req, res, next)` instead of three; Express recognizes that
signature and only calls it when `next(err)` is invoked or an async handler throws.

**37. How are routes organized?**
One router file per domain (`authRoutes.js`, `doctorRoutes.js`, `appointmentRoutes.js`,
`adminRoutes.js`, `notificationRoutes.js`), each mounted under its own path prefix in `app.js`.

**38. How do you apply authentication to a whole group of routes at once?**
`router.use(authenticate)` at the top of a router file applies that middleware to every route
defined below it in that file, e.g. all of `patientRoutes.js`.

---

## H. REST API

**39. What makes an API RESTful?**
Resource-oriented URLs, standard HTTP methods mapped to CRUD actions, and stateless requests
(each request carries everything needed to process it — here, the JWT — rather than relying
on server-side session state).

**40. How did you structure your endpoints?**
By resource: `/api/doctors`, `/api/appointments`, `/api/patients`, `/api/admin/*`. Nested
actions use sub-paths, e.g. `/api/appointments/:id/cancel`.

**41. Why use PATCH for `/appointments/:id/cancel` instead of PUT?**
`PATCH` signals a partial update (just the status), whereas `PUT` conventionally means
replacing the whole resource — using `PATCH` here communicates intent more precisely.

**42. How do you version this API if it needs to change later?**
It's not versioned yet since it's a single-consumer demo project, but the natural next step
would be prefixing routes with `/api/v1/` and introducing `/api/v2/` alongside it for breaking
changes.

---

## I. Authentication

**43. How does registration work end to end?**
Validate input → check email uniqueness → hash password with bcrypt → create `User` +
role-specific profile in one transaction → sign a JWT → return it to the client.

**44. Why hash passwords, and why bcrypt specifically?**
So a database leak doesn't expose real passwords. Bcrypt is intentionally slow and includes a
random salt per password, which makes brute-force and rainbow-table attacks impractical
compared to a fast, unsalted hash like plain SHA-256.

**45. What happens on login with a wrong password?**
A generic `401 "Invalid email or password"` — the same message whether the email doesn't
exist or the password is wrong, to avoid revealing which emails are registered.

**46. How is "logout" implemented if JWTs are stateless?**
Purely client-side: `AuthContext.logout()` clears the token and user from `localStorage`.
There's no server-side session to invalidate.

**47. What if a token is stolen?**
It stays valid until expiry (`JWT_EXPIRES_IN`) since there's no server-side blocklist in this
build. A production-hardened version would add a short-lived access token plus a refresh token
that can be revoked, or a token blocklist.

---

## J. JWT

**48. What are the three parts of a JWT?**
Header (algorithm/type), payload (claims — here, `userId` and `role`), and signature (proves
the token wasn't tampered with).

**49. Is the payload encrypted?**
No — it's base64-encoded, not encrypted, so anyone can read it. Never put secrets in a JWT
payload; only put non-sensitive identifiers like a user ID and role.

**50. How does the server verify a token is genuine?**
It recomputes the signature using its `JWT_SECRET` and compares it to the token's signature.
If they don't match — or the token is expired — verification fails and the request is
rejected with 401.

**51. Where is the JWT stored on the frontend, and what's the tradeoff?**
`localStorage`. It's simple and persists across tabs/reloads, but is readable by any
JavaScript running on the page, so it's vulnerable to XSS if the app had an XSS hole
elsewhere. An httpOnly cookie would be more XSS-resistant but adds CSRF considerations instead
— every storage choice here has tradeoffs, not a free win.

---

## K. Authorization

**52. What's the difference between authentication and authorization?**
Authentication confirms identity ("who are you"); authorization confirms permission ("are you
allowed to do this"). This project authenticates once at login and authorizes on every
subsequent protected request.

**53. How is role-based access control implemented?**
An `authorize(...roles)` middleware checks `req.user.role` against an allowed list and throws
403 if it doesn't match, applied per-route after `authenticate`.

**54. Beyond role checks, what else do you check?**
Resource ownership — e.g. a doctor can only act on appointments assigned to *them*, checked
explicitly in the controller (`assertAppointmentAccess`), not just "any doctor can touch any
appointment."

**55. Why isn't hiding a button in the UI enough security?**
Because a user can call the API directly (via Postman, browser dev tools, curl) bypassing the
UI entirely. The frontend check is a UX nicety; the backend check is the actual security
boundary.

---

## L. PostgreSQL

**56. Why a relational database instead of NoSQL here?**
The data is naturally relational (users, patients, doctors, appointments with clear foreign
keys), and the appointment booking feature specifically needs a strong uniqueness guarantee
that relational databases are built to enforce.

**57. What's a transaction, and where did you use one?**
A group of operations that all succeed or all fail together. Used when creating a `User` +
their `Patient`/`Doctor` profile together, so we never get a user account with no profile if
something fails partway.

**58. What's a unique constraint, and how did you use it for something other than emails?**
A rule that no two rows may share the same value(s) in specified columns. Used on
`(doctorId, appointmentDate, startTime)` in `appointments` — the core mechanism preventing
double booking.

**59. What happens if a unique constraint is violated?**
PostgreSQL rejects the insert with an error; Prisma surfaces it as error code `P2002`, which
this project's error handler turns into a clean `409 Conflict` response.

---

## M. Prisma

**60. What is Prisma, in one sentence?**
An ORM that lets you define your database schema once and query it from JavaScript/TypeScript
with a generated, type-safe client instead of writing raw SQL.

**61. How do migrations work in Prisma?**
`prisma migrate dev` compares your `schema.prisma` to the database's current state, generates
a SQL migration file for the difference, and applies it — keeping a versioned history of every
schema change.

**62. How do you fetch related data in one query?**
The `include` option, e.g. `prisma.appointment.findMany({ include: { doctor: true, patient:
true } })` — Prisma generates the appropriate join(s) under the hood.

**63. What's the difference between `migrate dev` and `migrate deploy`?**
`migrate dev` is for local development — it can prompt, reset the dev database, and generate
new migration files. `migrate deploy` is for production/CI — it only applies existing
migrations non-interactively, which is what this project's deployment guide uses.

---

## N. Database Design

**64. Walk me through your schema at a high level.**
`User` is the auth root; `Patient` and `Doctor` are 1:1 profile extensions of it;
`Specialization` and `DoctorSpecialization` form a many-to-many; `DoctorAvailability` defines
recurring weekly windows; `Appointment` is the core transactional table; `Notification` and
`AuditLog` support the UX and admin oversight.

**65. Why split `User` from `Patient`/`Doctor` instead of one big table?**
Keeps the authentication table role-agnostic and lean, and avoids a table full of columns that
are only relevant to one role (e.g. `consultationFee` would be meaningless on a patient row).

**66. How did you model the many-to-many between doctors and specializations?**
An explicit join table, `DoctorSpecialization`, rather than Prisma's implicit many-to-many —
explicit is more visible in the schema and easier to extend later (e.g. adding a "primary
specialization" flag).

**67. Why store availability as recurring weekly windows instead of individual slot rows?**
Far less data to manage and update — a doctor sets their pattern once, and the slot list for
any given date is computed on demand, rather than needing thousands of pre-generated slot rows
that would need bulk updates whenever a doctor changes their schedule.

**68. What indexes did you add, and why?**
`appointments(patientId)`, `appointments(doctorId, appointmentDate)`, and
`appointments(status)` — matching the three most common query patterns: a patient's own
appointments, a doctor's appointments on a date, and admin filtering by status.

---

## O. SQL (concepts, even though Prisma abstracts raw SQL)

**69. What SQL would roughly correspond to `prisma.doctor.findMany({ where: { approvalStatus:
"APPROVED" } })`?**
`SELECT * FROM doctors WHERE approval_status = 'APPROVED';`

**70. What's a JOIN, conceptually?**
Combining rows from two tables based on a matching column, e.g. joining `appointments` to
`doctors` on `appointments.doctor_id = doctors.id` to get the doctor's name alongside each
appointment.

**71. What's the difference between `WHERE` and `HAVING`?**
`WHERE` filters individual rows before grouping; `HAVING` filters after a `GROUP BY`
aggregation. This project doesn't currently use aggregate grouping, but the admin dashboard
stats (counts) are a candidate for `GROUP BY` if extended further (e.g. appointments per
status).

**72. What's a composite unique constraint?**
A uniqueness rule spanning multiple columns together rather than one column alone — exactly
what prevents double booking here: no two rows can share the same doctor + date + start time
combination, even though none of those three columns is unique on its own.

---

## P. Appointment Booking (project-specific deep dive)

**73. Walk me through the whole booking flow.**
See `docs/appointment-flow.md` — in short: pick doctor → pick date → backend computes free
slots from weekly availability minus existing bookings/past times → pick slot → backend
re-validates and inserts, protected by a unique constraint → doctor notified.

**74. How exactly do you generate available slots?**
`generateSlots(startTime, endTime, durationMinutes)` walks the window in fixed-size steps
(e.g. every 30 minutes) producing candidate slots, then the controller filters out any slot
that already has a `PENDING`/`CONFIRMED` appointment or is already in the past for today.

**75. What HTTP status do you return for a slot that's no longer available, and why that
code?**
`409 Conflict` — the request is well-formed and the user is authorized, but it conflicts with
the current state of the resource (the slot got taken).

**76. How do you prevent booking a doctor who isn't approved yet?**
The controller checks `doctor.approvalStatus === "APPROVED"` before allowing a booking, and
separately, unapproved doctors don't appear in the public search/listing endpoints at all.

**77. What happens to an appointment's status when it's rescheduled?**
It resets to `PENDING` — a rescheduled time is treated as a new proposal that the doctor should
re-confirm, since their availability check for the new time is fresh.

**78. Can a doctor reschedule an appointment, or only the patient?**
Either — `assertAppointmentAccess` allows the owning patient, the owning doctor, or an admin,
since a doctor might need to move a visit due to their own scheduling conflict.

---

## Q. Security

**79. What security measures are in this project?**
bcrypt password hashing, JWT authentication, role + resource-level authorization,
`express-validator` input validation, `helmet` for security headers, CORS restricted to known
origins, environment variables for all secrets, generic auth error messages, and basic rate
limiting.

**80. How do you avoid exposing sensitive data in API responses?**
The `toSafeUser()` helper strips `passwordHash` before returning a user object; admin listing
endpoints select only safe fields explicitly rather than returning full rows.

**81. How is rate limiting configured?**
`express-rate-limit` applied to all `/api` routes, capping requests per IP within a time
window (configurable via `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`), to blunt basic brute-force
or abuse attempts.

**82. How do you prevent SQL injection?**
By using Prisma's query builder exclusively instead of hand-written SQL strings — Prisma
parameterizes queries under the hood, so user input is never concatenated directly into SQL.

**83. Is this app HIPAA compliant?**
No, and it explicitly says so in the README — HIPAA compliance requires far more than good
coding practices (legal agreements, audit controls, encryption-at-rest guarantees, access
logging, business associate agreements, etc.), none of which are claimed here.

---

## R. Error Handling

**84. How are errors handled centrally?**
A custom `ApiError` class carries an HTTP status code; any code can `throw new ApiError(404,
"...")`; `asyncHandler` forwards thrown/rejected errors to Express's error pipeline; one
`errorHandler` middleware at the end of `app.js` catches everything and returns a consistent
JSON response.

**85. How do you handle a Prisma "not found" error differently from a validation error?**
`errorHandler` checks Prisma's error codes — `P2025` (record not found) maps to 404, `P2002`
(unique constraint) maps to 409 — while `express-validator` failures are caught earlier by the
`validate` middleware and return 422 with per-field details.

**86. What does the user see if the server has an unexpected bug?**
A generic `500 "Internal server error"` message — the actual error/stack trace is only logged
to the server console in development, never sent to the client.

---

## S. Testing

**87. What kind of tests did you write, and why that approach?**
Integration tests using Node's built-in test runner, hitting a real running instance of the
API rather than mocking — because the two most important behaviors (authorization,
double-booking prevention) only mean something when tested against real concurrent HTTP
requests and the real database constraint.

**88. How did you test the double-booking race condition specifically?**
Two patient accounts fire a booking request for the identical doctor/date/slot at the same
time using `Promise.all`, then the test asserts exactly one response is `201` and the other is
`409`.

**89. What would you add to the test suite next?**
Frontend component tests (e.g. with React Testing Library) for form validation and protected
route redirects, and a CI pipeline that spins up a disposable test database automatically.

**90. How do you test manually before considering a feature done?**
A documented manual checklist per role (see `docs/testing-guide.md`) covering the happy path
and the obvious edge cases (wrong password, already-booked slot, unauthorized access,
past-date booking).

---

## T. Deployment

**91. How would you deploy this?**
Frontend as a static Vite build on Vercel; backend as a Node web service on Render/Railway;
database on a managed PostgreSQL provider — three independently deployed pieces connected by
environment variables.

**92. What environment variables differ between local and production?**
`DATABASE_URL` (different DB), `JWT_SECRET` (must be different/stronger in production),
`CORS_ORIGIN` (the deployed frontend URL instead of localhost), and `NODE_ENV=production`.

**93. What's the difference between `migrate dev` and what you'd run in production deploy?**
`migrate deploy`, non-interactive, only applies already-generated migrations — never
auto-generates new ones or prompts, which would be dangerous in an automated deploy pipeline.

**94. How do frontend and backend find each other after deployment?**
Purely through environment variables — the frontend's `VITE_API_BASE_URL` points at the
backend's public URL, and the backend's `CORS_ORIGIN` must list the frontend's public URL.

---

## U. Scalability

**95. What's the first bottleneck likely to be under load?**
The database — specifically the appointment-availability computation, which runs a few
queries per request. Caching a doctor's weekly availability pattern (which rarely changes)
would reduce repeated work.

**96. How would you horizontally scale the backend?**
Since it's stateless (JWT auth, no in-memory session data), you can run multiple instances
behind a load balancer with no special session affinity needed.

**97. How would you handle a doctor with a very large number of appointments?**
Pagination — the current `listAppointments` returns everything for simplicity; a production
version would add `limit`/`cursor` or `page`/`pageSize` parameters.

---

## V. Real-World Scenarios

**98. A patient says they were double-charged/double-booked. How would you investigate?**
Check the `appointments` table for that patient/doctor/date — since the unique constraint
guarantees only one row can exist per doctor+date+time, if there are two appointments they'd
necessarily be at *different* times, which would explain what actually happened rather than a
true double-booking bug. I'd also check `audit_logs` and `notifications` for a timeline.

**99. A doctor says a patient can see another patient's appointment details. What would you
check first?**
The `assertAppointmentAccess` authorization check in `appointmentController.js` — confirm it's
actually being called on the `GET /appointments/:id` route and hasn't been bypassed or
misconfigured for that endpoint.

**100. The database connection is failing intermittently in production. What do you check?**
Connection pool limits (Prisma's default pool size vs. how many app instances are running),
the database provider's connection limits, and whether `DATABASE_URL` needs SSL parameters
that are only enforced in production.

**101. A doctor wants to block off a single day without changing their whole weekly
schedule. Does the current design support that?**
Not yet — `DoctorAvailability` only models a recurring weekly pattern. I'd add a
`DoctorTimeOff` table (doctorId, date, reason) and check it alongside the weekly pattern when
computing free slots for a given date.

---

## W. HR / Project Questions

**102. What was your role in building this?**
*(Answer honestly based on your own involvement — this file exists so you genuinely
understand every part well enough to answer this credibly, not to script a claim for you.)*

**103. What are you most proud of in this project?**
The double-booking prevention — it's the one piece of genuine business logic with a real
concurrency problem, and I can explain exactly why the fix works at the database level, not
just "I added a check."

**104. What was the most challenging bug or decision?**
Deciding where the "source of truth" for slot availability should live — resisting the urge to
trust the frontend's slot list and instead always recomputing it server-side before booking.

**105. If you had one more week, what would you build next?**
One-off doctor availability exceptions (holidays), so the schedule model is fully realistic.

**106. How do you decide what to work on next in a project like this?**
Prioritize whatever the "spine" of the feature is first — for this project, that meant getting
real booking + double-booking prevention solid before polishing UI details, since a beautiful
UI on top of a broken booking guarantee would be worse than the reverse.
