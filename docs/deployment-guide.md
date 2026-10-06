# Deployment Guide

This guide describes how to deploy MediCare Connect using free/low-cost tiers of common
providers. No live deployment was created as part of building this project — follow these
steps to deploy it yourself. Substitute equivalent providers if you prefer.

## 1. Database — managed PostgreSQL

Pick one: Neon, Supabase, Railway, or Render's managed Postgres.

1. Create a new Postgres instance/project.
2. Copy the connection string it gives you (starts with `postgresql://...`).
3. Most providers require `?sslmode=require` appended for external connections — check your
   provider's docs.

## 2. Backend — Render or Railway

1. Push this repository to GitHub (excluding `node_modules` and `.env`, per `.gitignore`).
2. Create a new **Web Service** in Render/Railway, pointing at the `backend/` directory as
   the root.
3. Build command: `npm install && npx prisma generate`
4. Start command: `npm run prisma:deploy && npm start`
   (`prisma migrate deploy` applies pending migrations without prompting — the correct command
   for production, unlike `migrate dev`.)
5. Set environment variables in the provider's dashboard (never commit these):
   - `DATABASE_URL` — the connection string from step 1
   - `JWT_SECRET` — a long random string, different from your local dev secret
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `NODE_ENV=production`
   - `CORS_ORIGIN` — your deployed frontend's URL (set this after step 3 below, then redeploy)
   - `PORT` — most providers set this automatically; otherwise use `5000`
6. Deploy. Confirm `GET https://your-backend-url/api/health` returns a healthy response.
7. (Optional, one-time) Run the seed script against production if you want demo data there:
   most providers offer a one-off "shell"/"run command" feature — run `npm run seed` through
   it. Be aware this wipes and reseeds the appointments/users/doctors tables — do not do this
   against a database with real data.

## 3. Frontend — Vercel

1. Import the same GitHub repo into Vercel, set the **root directory** to `frontend/`.
2. Framework preset: Vite.
3. Build command: `npm run build` — output directory: `dist`.
4. Environment variable: `VITE_API_BASE_URL=https://your-backend-url/api`
5. Deploy. Vercel gives you a URL like `https://your-project.vercel.app`.
6. Go back to the backend's `CORS_ORIGIN` env var and set it to this Vercel URL, then redeploy
   the backend so it accepts requests from the deployed frontend.

## 4. Connecting frontend and backend

The only coupling between the two deployed services is:
- Frontend's `VITE_API_BASE_URL` must point at the backend's public URL + `/api`.
- Backend's `CORS_ORIGIN` must include the frontend's public URL exactly (protocol + domain,
  no trailing slash).

If you see CORS errors in the browser console after deploying, it's almost always one of
those two values being wrong or mismatched (e.g. `http` vs `https`, or a trailing slash).

## 5. Production troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend deploy fails at build step | `npx prisma generate` needs `DATABASE_URL` set even to generate the client on some providers — confirm the env var is set before build, not just before start |
| Backend deploy succeeds but crashes on start | Check the start command actually ran `prisma migrate deploy` before `npm start`, and that `DATABASE_URL` is reachable from the provider's network (some DBs restrict by IP allowlist) |
| Frontend builds but every API call fails | `VITE_API_BASE_URL` is a **build-time** variable in Vite — if you change it, you must trigger a new build, not just restart |
| Login works but subsequent requests get 401 | Usually a `JWT_SECRET` mismatch (e.g. it changed between deploys) — existing tokens become invalid whenever the secret changes; users just need to log in again |
| CORS errors only in production, not locally | `CORS_ORIGIN` on the backend doesn't include the deployed frontend's exact URL |

## 6. What this deployment setup does NOT include

- A CDN or custom domain (use the provider's default URL, or configure your own domain
  through the provider's dashboard).
- Automated CI/CD test runs before deploy (not configured in this project; most of the
  providers above support connecting a GitHub Actions workflow if desired).
- Database backups/point-in-time recovery — enable this through your Postgres provider if you
  ever store anything beyond demo data.
