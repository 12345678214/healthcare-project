# Technical Concepts — Beginner-Friendly Glossary

Each concept: what it means, and how it's actually used in this project.

### Client-server architecture
Two separate programs talk over a network: the **client** (the React app in your browser)
asks for things, and the **server** (the Express API) does the work and answers. Neither can
function alone — the browser has no database access, and the server has no UI.

### REST API
A style for designing APIs where you interact with "resources" (doctors, appointments) using
standard HTTP methods. `GET /doctors` fetches doctors; `POST /appointments` creates a new
appointment. Predictable and consistent, which is why every URL in this project follows the
same shape.

### HTTP methods
- `GET` — read data, never changes anything (e.g. list doctors)
- `POST` — create something new (e.g. book an appointment)
- `PUT` — replace/update something (e.g. reschedule)
- `PATCH` — partially update something (e.g. just change status)
- `DELETE` — remove something (e.g. remove an availability window)

### HTTP status codes
Numbers that summarize what happened: `200` OK, `201` Created, `400` bad input, `401` not
logged in, `403` logged in but not allowed, `404` not found, `409` conflict (e.g. slot already
booked), `422` validation failed, `500` server error. This project returns the correct one for
every situation instead of always returning `200`.

### JWT (JSON Web Token)
A compact, signed piece of text proving who you are without the server needing to remember
you. Explained in detail in `authentication-flow.md`.

### Authentication vs. authorization
**Authentication** answers "who are you?" (logging in). **Authorization** answers "are you
allowed to do this?" (e.g. only a doctor can confirm their own appointments). This project
does authentication once at login, then authorization on every request afterward.

### Middleware
A function that runs *before* your actual route logic, usually to check something or modify
the request. `authenticate` (checks you're logged in) and `authorize` (checks your role) are
both middleware — they run first, and only call `next()` to continue if everything checks out.

### Password hashing
Turning a password into a scrambled, one-way string (`bcrypt.hash`) before storing it. Even if
the database were leaked, the real passwords couldn't be recovered from the hashes. Logging in
compares a new hash of the entered password against the stored hash (`bcrypt.compare`) — the
plain password is never stored anywhere.

### CRUD
Create, Read, Update, Delete — the four basic operations every resource in this app supports
in some form (e.g. appointments: create a booking, read your appointments, update by
rescheduling, "delete" by cancelling).

### ORM (Object-Relational Mapper)
A tool that lets you interact with a SQL database using your programming language's objects
and methods instead of writing raw SQL strings. Prisma is this project's ORM.

### Prisma
The specific ORM used here. You describe your tables once in `schema.prisma`; Prisma
generates a JavaScript client with methods like `prisma.doctor.findMany()`, plus handles
database migrations (turning schema changes into safe, ordered SQL scripts).

### PostgreSQL
An open-source relational (table-based) database. Chosen here because appointment booking
needs strong data-integrity guarantees (unique constraints, foreign keys, transactions) that
relational databases are built for.

### Primary key
A column (or set of columns) that uniquely identifies each row in a table. Every table here
uses a UUID string as its primary key (`id`).

### Foreign key
A column in one table that points to the primary key of another table, creating a link
between them. E.g. `Appointment.doctorId` points to `Doctor.id`.

### Joins
Combining rows from two related tables in one query (e.g. "get this appointment along with
its doctor's name"). Prisma does this behind the scenes when you use `include`, e.g.
`prisma.appointment.findMany({ include: { doctor: true } })`.

### Indexes
A database structure that speeds up looking things up by a specific column, at the cost of
some extra storage. This project indexes columns that are searched/filtered on often, like
`appointments.status` and `appointments(doctorId, appointmentDate)`.

### Transactions
A group of database operations that either *all* succeed together or *all* fail together —
nothing is left half-done. Used here when creating a user + their patient/doctor profile
together (`prisma.$transaction`), so we never end up with a user account that has no profile.

### Race conditions
A bug that only happens when two things occur at nearly the same time in an unpredictable
order. The classic example here: two patients trying to book the exact same appointment slot
simultaneously. Solved not by "being careful" in the application code (which can't fully
prevent it) but by a database-level unique constraint — see `appointment-flow.md`.

### Double booking
The specific race condition this project protects against: two different appointments ending
up with the same doctor, date, and start time. Prevented by a `@@unique` constraint on the
`Appointment` model.

### Database constraints
Rules the database itself enforces, no matter what application code tries to do — e.g. "this
combination of columns must be unique," or "this foreign key must point to a row that
actually exists." These are considered the most trustworthy layer of validation because they
can't be bypassed by a bug in the application code.

### CORS (Cross-Origin Resource Sharing)
A browser security feature that blocks a webpage from calling an API on a different
domain/port unless that API explicitly allows it. The backend's `CORS_ORIGIN` setting tells
it which frontend URLs are allowed to call it.

### Environment variables
Configuration values (database URLs, secret keys) kept outside the source code, usually in a
`.env` file that's never committed to version control. This keeps secrets out of your Git
history and lets the same code run with different settings in development vs. production.

### Error handling
Catching problems (bad input, missing records, database errors) and responding with a clear,
consistent message instead of crashing. This project centralizes that into one
`errorHandler` middleware so every route behaves the same way when something goes wrong.

### API validation
Checking that incoming request data is well-formed *before* acting on it — e.g. rejecting a
registration request with an invalid email before it ever reaches the database.

### React components
Reusable, self-contained pieces of UI, written as JavaScript functions that return what should
be displayed. `StatusBadge`, `Navbar`, and every page in this project are components.

### React hooks
Functions like `useState` (store data that can change) and `useEffect` (run code when a
component loads or something changes) that let function components manage state and side
effects. Used throughout — e.g. `BookAppointment.jsx` uses `useState` to track the selected
date/slot and `useEffect` to fetch available slots whenever the date changes.

### React Router
The library that maps URLs to which component is shown, without a full page reload. Route
definitions live in `App.jsx`.

### Axios
A library for making HTTP requests from JavaScript, used instead of the raw `fetch` API for
its cleaner syntax and built-in support for interceptors (used here to automatically attach
the JWT to every request).

### Protected routes
Routes that require the user to be logged in (and sometimes a specific role) before they can
be viewed. Implemented with the `<ProtectedRoute>` component, which redirects unauthenticated
or unauthorized users away — a UX convenience backed by the real security check on the server.
