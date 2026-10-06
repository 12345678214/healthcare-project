# "Explain My Project" — Pitch Scripts

Practice these out loud. They're written to sound like a person talking, not a README.

---

## 30-second version

"I built a full-stack healthcare appointment booking system — think a mini Practo. Patients
search for doctors, see their real-time availability, and book a slot. Doctors manage their
schedule and confirm or complete visits. Admins approve doctor accounts and oversee the whole
platform. It's React on the frontend, Node and Express on the backend, and PostgreSQL with
Prisma for the database, with JWT-based authentication and role-based access control
throughout."

---

## 1-minute version

"I built a full-stack healthcare appointment management system. There are three types of
users — patients, doctors, and admins — each with their own dashboard and permissions.

Patients can search doctors by specialization or name, see a doctor's actual open time slots
for any date, and book an appointment. Doctors set their weekly availability and then confirm,
reject, or complete the appointments that come in. Admins approve new doctor accounts before
they go live, and can see system-wide stats.

The stack is React with Tailwind on the frontend, Node/Express REST API on the backend, and
PostgreSQL through Prisma for the database. Authentication is JWT-based, and every sensitive
action is checked twice — once on the frontend for a smooth experience, and again on the
backend, which is the actual security boundary.

The part I'm most proud of is the booking logic — specifically how it prevents two patients
from double-booking the same slot, even if they click 'book' at the exact same moment."

---

## 2-minute version

"I built a full-stack healthcare appointment management system with three roles: patients,
doctors, and admins.

A patient can search for doctors by name or specialization, open a doctor's profile to see
their weekly availability, pick a date, and see the actual open time slots for that specific
day — not just a static schedule, but real availability with already-booked and past slots
filtered out. They book, and the appointment goes in as 'pending' until the doctor confirms
it. They can also reschedule or cancel from their dashboard, and get in-app notifications when
a doctor updates the status.

Doctors have their own dashboard: they define their availability as recurring weekly windows —
like 'Mondays 9 to 1, in 30-minute blocks' — and the system expands that into concrete slots
automatically. They see incoming requests and can confirm, reject, or mark a visit as
completed.

Admins approve new doctor registrations before they become visible to patients, can
deactivate any account, manage the list of specializations, and see dashboard stats — total
patients, doctors, pending appointments, and so on.

Technically, it's a React frontend talking to a Node/Express REST API, backed by PostgreSQL
through Prisma. Authentication uses JWTs with bcrypt-hashed passwords, and role-based
authorization is enforced on the backend — the frontend hiding pages you shouldn't see is just
a UX nicety, not the actual security.

The piece I'd highlight most is how double-booking is prevented. The backend does check slot
availability before booking, but the real guarantee is a database-level unique constraint on
doctor, date, and start time — so even if two requests hit the server at the exact same
instant, the database itself only allows one insert to succeed. I actually wrote an
integration test that fires two booking requests concurrently and asserts exactly one wins."

---

## 5-minute detailed version

"I'll walk through this as: the problem, the architecture, the core feature, and then a couple
of the harder decisions I made.

**The problem.** Booking a doctor's appointment traditionally means a phone call and no real
visibility into what's actually free. This system puts a doctor's real schedule online so
patients can book directly against real availability.

**The architecture.** It's a modular monolith, deliberately not microservices — one React
frontend, one Express backend, one PostgreSQL database. For a project this size, splitting
into services would add deployment and networking complexity with no real benefit; a single,
well-organized backend is easier to build, test, and reason about. The backend follows a
layered structure: routes wire up which controller handles a URL and which middleware runs
first, middleware handles cross-cutting concerns like authentication and validation,
controllers hold the actual business logic, and Prisma is the only thing that talks to the
database.

**Roles.** Three: patient, doctor, admin, all stored as one 'role' field on a shared `User`
table, with role-specific profile data (like a doctor's consultation fee, or a patient's date
of birth) split into separate `Patient` and `Doctor` tables linked one-to-one back to `User`.
That split keeps the authentication table lean and role-agnostic.

**The core feature — booking.** A doctor doesn't manually create individual time slots.
Instead they define recurring weekly windows, like 'Tuesdays 3 to 6pm, 30-minute slots.' When
a patient picks a date, the backend expands that window into concrete slot options, then
removes anything already booked and anything already in the past if it's today. That's what
populates the slot grid the patient picks from.

When they confirm a slot, the backend doesn't trust the frontend's idea of what's free — it
recomputes availability server-side before saving. And here's the detail I think matters most:
even that recheck isn't airtight against two simultaneous requests, because checking
availability and then inserting the appointment are two separate steps — a classic
check-then-act race condition. The actual guarantee comes from a database-level unique
constraint on doctor plus date plus start time. If two bookings for the same slot land at the
database at nearly the same instant, Postgres itself only allows one insert to succeed; the
other fails with a constraint violation, which the backend catches and turns into a clean
'this slot was just taken' response. I wrote an integration test that fires both requests
concurrently with `Promise.all` and asserts exactly one gets a 201 and the other a 409 — proof
the constraint does its job under real concurrency, not just in the happy path.

**Harder decisions.** First, JWT vs. sessions — I went with JWT because it's stateless, which
keeps the backend simple to run and scale, at the cost of not being able to instantly
invalidate a token before it expires; for this project's scope, that tradeoff is fine. Second,
plain JavaScript vs. TypeScript — I stayed with JavaScript because the project's size didn't
justify TypeScript's tooling overhead for this build, though I'd reach for it on a larger
codebase. Third, keeping authorization checks in two layers — frontend route guards for a
smooth experience, but always re-checked on the backend, because the frontend can never be
trusted as the real security boundary.

**What I'd add next.** Email/SMS reminders, one-off doctor availability exceptions like
holidays, payment integration for the consultation fee, and a patient medical record/
prescription history — all designed to layer onto the current architecture without a rewrite."
