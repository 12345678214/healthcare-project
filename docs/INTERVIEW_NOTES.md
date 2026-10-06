# Interview Notes — Explain This Project in Plain English

Read this like you're explaining the project to a friend who knows how to code but has never
seen it. Every section here is written so you can say it out loud, close to word-for-word, and
sound like you built it (because you can, once you understand these explanations).

## What is this project?

It's a website where patients can find doctors and book appointments online, doctors can
manage their schedule and see who's coming in, and an admin oversees the whole system —
approving doctors, managing users, and watching overall stats. Think of it like a mini version
of Practo or ZocDoc.

## What problem does it solve?

Booking a doctor's appointment the old way means phone calls, being put on hold, and not
knowing what times are actually free. This system puts the doctor's real schedule online so a
patient can see exactly what's open and book instantly, without a phone call.

## Why did we build it this way?

Three separate experiences (patient, doctor, admin) sharing one backend and one database. We
didn't split it into microservices because the project doesn't need that complexity — one
well-organized Node.js server is easier to build, deploy, debug, and explain than five small
services talking to each other over the network.

## How does the complete system work, end to end?

1. The **frontend** is a React app — a single page that never fully reloads; React Router
   swaps out what's shown based on the URL.
2. When you do something that needs data (log in, book an appointment, view your profile),
   the frontend sends an HTTP request to the **backend** using Axios.
3. The **backend** is an Express.js server. It receives the request, checks who you are (via a
   JWT token), checks whether you're allowed to do this action, then talks to the
   **database**.
4. The backend never writes raw SQL — it uses **Prisma**, a tool that lets us write JavaScript
   like `prisma.appointment.create(...)` and Prisma turns that into the correct SQL for
   PostgreSQL.
5. **PostgreSQL** stores everything permanently — users, doctors, patients, appointments.
6. The backend sends a JSON response back; the frontend updates what's on screen.

## How does the frontend talk to the backend?

Through REST API calls made with Axios. Every API call lives in one folder
(`frontend/src/api/`) so it's easy to see every request the app can make. Each request
includes the user's login token in a header, so the backend knows who's asking.

## How does the backend talk to the database?

Through Prisma. We wrote a schema file (`schema.prisma`) describing every table and how they
relate. Prisma reads that file and generates a JavaScript "client" we call from our code —
`prisma.doctor.findMany()`, `prisma.appointment.create()`, and so on. This means we get
autocomplete and type-safety instead of writing SQL strings by hand, which is both faster to
write and much harder to get wrong (like accidentally creating a SQL injection bug).

## How does authentication work?

When you register or log in, the backend checks your password (hashed with bcrypt, so we
never store your actual password), and if it's correct, creates a **JWT** — a signed token
that says "this is user X with role Y." The frontend stores that token and attaches it to
every future request. The backend checks the token's signature on every protected request to
confirm it's genuine and hasn't expired.

## How does JWT actually work?

A JWT has three parts separated by dots: header, payload, signature. The payload holds data
like the user's ID and role. The signature is created using a secret key that only the server
knows — so if anyone tampers with the payload, the signature won't match anymore, and the
server rejects the token. That's what makes it trustworthy without the server having to
"remember" every logged-in session.

## How does role-based authorization work?

Every user has a role: PATIENT, DOCTOR, or ADMIN. On the backend, sensitive routes are
wrapped with a check like `authorize("ADMIN")` that looks at the logged-in user's role and
rejects the request with a 403 error if it doesn't match. On the frontend, we hide pages the
user shouldn't see using a `ProtectedRoute` component — but that's just for a good user
experience; the *real* security check always happens on the backend, because a user could
technically bypass frontend checks.

## How does appointment booking work?

1. Patient picks a doctor, then a date.
2. The backend looks at that doctor's weekly availability (e.g. "Mondays 9am–1pm in 30-minute
   blocks") and generates the list of possible time slots for that date.
3. It removes any slot that's already booked, and any slot that's already in the past if
   you're booking for today.
4. Patient picks one of the remaining slots and confirms.
5. The backend double-checks that slot is still free (in case someone else grabbed it a
   second ago), then saves the appointment with status "PENDING."
6. The doctor gets a notification and can confirm or reject it from their dashboard.

## How is double booking prevented?

Two safety nets:
1. **Application-level check**: before saving, the backend recalculates the free slots and
   confirms the requested one is still available.
2. **Database-level constraint**: the appointments table has a rule that says no two rows can
   have the exact same doctor + date + time. Even if two people click "book" at literally the
   same millisecond, the database itself only allows one of those two inserts to succeed — the
   second one is automatically rejected. This is the real guarantee, because the
   application-level check alone can't fully protect against two things happening at the
   exact same instant (this is called a "race condition").

## How do database relationships work here?

- A `User` has *one* `Patient` profile **or** *one* `Doctor` profile — a one-to-one
  relationship, using a foreign key that's marked unique.
- A `Doctor` can have *many* `Appointments`, and each `Appointment` belongs to exactly *one*
  doctor — a one-to-many relationship.
- A `Doctor` can have *many* `Specializations`, and a `Specialization` (like "Cardiology")
  applies to *many* doctors — a many-to-many relationship, implemented with a middle "join"
  table (`DoctorSpecialization`) that just stores pairs of IDs.

## Why PostgreSQL?

It's a mature, reliable, open-source relational database with strong support for exactly the
kind of data integrity guarantees this project needs — foreign keys, unique constraints, and
transactions. Appointment booking specifically needs the guarantee that a unique constraint
provides (see the double-booking answer above), which is a natural fit for a relational
database rather than a NoSQL one.

## Why Prisma?

It gives us a type-safe, auto-completed way to query the database from JavaScript, generates
migration files automatically from schema changes, and makes relationships (like "get this
appointment along with its doctor and patient") a one-line `include` instead of hand-written
JOIN SQL. For a small-to-medium project like this, it dramatically speeds up development
without sacrificing correctness.

## Why Express.js?

It's the most widely-used Node.js web framework — minimal, unopinionated, and easy to
structure cleanly (routes → middleware → controllers). For a REST API of this size, it's a
proven, well-understood choice that's easy for any other developer (or interviewer) to read.

## Why React?

Component-based UI makes it natural to build once and reuse — `StatusBadge`, `DashboardLayout`,
`ConfirmDialog` are each written once and used across dozens of pages. React Router handles
navigating between pages without full browser reloads, keeping the experience fast.

## Why REST API (and not GraphQL)?

REST is simpler to build, simpler to test with tools like Postman, and this project's data
needs are straightforward (fetch a list, fetch one item, create/update/delete) — exactly what
REST is good at. GraphQL's flexibility shines when a frontend needs to combine many different
data shapes in one request; this project doesn't have that complexity yet.

## Error handling in one sentence

Every route is wrapped so that any error — a validation failure, a "not found," a database
conflict — flows to one central error-handling function that turns it into a consistent,
readable JSON response instead of crashing the server or leaking a stack trace to the user.

## Validation in one sentence

Incoming request bodies are checked against explicit rules (`express-validator`) before any
business logic runs — e.g. "email must be a valid email," "password must be at least 6
characters" — so bad data never reaches the database layer.

## Deployment architecture, briefly

Frontend deployed as a static build to Vercel. Backend deployed as a Node.js web service to
Render/Railway. Database hosted on a managed PostgreSQL provider. They're three independent
pieces connected only by URLs and environment variables (`VITE_API_BASE_URL` on the frontend,
`CORS_ORIGIN` on the backend).

## Limitations, honestly

- Not HIPAA/GDPR compliant — this is a demo, not a real medical system.
- No email/SMS — notifications are in-app only.
- No payments.
- A doctor's availability is a fixed weekly pattern; there's no way yet to mark a single day
  off (like a holiday) without changing the whole weekly pattern.
- No automated frontend tests yet, though the backend has integration tests covering auth and
  the double-booking race condition specifically.

## Future improvements, honestly

Email/SMS reminders, one-off availability exceptions (holidays/leave), payment integration,
video consultation, and patient medical record/prescription history are the natural next
features — all designed to slot into the existing architecture without a rewrite.
