# Setup Guide

Detailed local setup, expanded from the README's quick version.

## 1. Prerequisites

- **Node.js 18+** and npm (check with `node -v` / `npm -v`)
- **PostgreSQL 13+**, running locally or accessible remotely. Options:
  - Install locally (postgresql.org) and create a database, e.g. `createdb healthcare_db`
  - Run via Docker: `docker run --name healthcare-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
  - Use a free-tier cloud Postgres (Neon, Supabase, Railway, Render) and copy its connection string

## 2. Get the code

Unzip `Healthcare-Appointment-Management-System.zip` (or clone the repo) and `cd` into it.

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthcare_db?schema=public"
JWT_SECRET="generate-a-long-random-string-here"
```

Generate a secret quickly: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Apply the schema and load demo data:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Start the API:
```bash
npm run dev
```
You should see:
```
Database connected.
Server running on http://localhost:5000
```

Sanity check: `curl http://localhost:5000/api/health` should return
`{"success":true,"message":"API is healthy",...}`.

## 4. Frontend setup

In a **second terminal**:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the printed URL (default `http://localhost:5173`).

## 5. First login

Use any of the seeded demo accounts (see README section 6), or register a new patient/doctor
account from the UI. A newly registered doctor account needs an admin to approve it
(log in as `admin@healthcare.demo`, go to Admin → Doctors) before it appears in patient
search.

## 6. Common setup issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend crashes with "Missing required environment variable" | `.env` not created/filled in | Copy `.env.example` to `.env` and fill in real values |
| `P1001: Can't reach database server` | Postgres isn't running, or `DATABASE_URL` is wrong | Confirm Postgres is up and the connection string's host/port/credentials are correct |
| Frontend shows network errors on every page | Backend isn't running, or `VITE_API_BASE_URL` points at the wrong port | Start the backend; confirm the port in `frontend/.env` matches `backend/.env`'s `PORT` |
| CORS error in browser console | Frontend origin not in backend's `CORS_ORIGIN` | Add the frontend's URL to `CORS_ORIGIN` in `backend/.env`, comma-separated if multiple |
| `npx prisma migrate dev` fails with permission error | Postgres user lacks privileges on the database | Grant the user privileges, or use a superuser locally for development |
| Doctor doesn't show up in search after registering | Doctor accounts start `PENDING` | Approve them from the Admin → Doctors page |
