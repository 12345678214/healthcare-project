/**
 * Integration-style tests using Node's built-in test runner + a live
 * server instance talking to the database defined by DATABASE_URL.
 *
 * These are written against a REAL running API (not mocked) because
 * the most important behaviors here — double-booking prevention and
 * authorization — only mean something when checked end-to-end against
 * actual HTTP requests and the actual database constraint.
 *
 * Prerequisites before running `npm test`:
 *   1. DATABASE_URL points at a running Postgres instance (a disposable
 *      test database is recommended, e.g. healthcare_test_db).
 *   2. Migrations have been applied: `npx prisma migrate deploy`.
 *   3. The server is reachable at BASE_URL (default http://localhost:5000).
 *
 * See docs/testing-guide.md for full setup instructions.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@test.demo`;
}

test("auth: register + login round trip", async () => {
  const email = uniqueEmail("patient");
  const registerRes = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password@123", role: "PATIENT", fullName: "Test Patient" }),
  });
  assert.equal(registerRes.status, 201);
  assert.ok(registerRes.body.data.token);

  const loginRes = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password@123" }),
  });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.data.token);
});

test("auth: wrong password is rejected with 401", async () => {
  const email = uniqueEmail("patient");
  await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password@123", role: "PATIENT", fullName: "Test Patient" }),
  });
  const res = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "wrong-password" }),
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test("authorization: unauthenticated request to /api/appointments is rejected", async () => {
  const res = await api("/api/appointments");
  assert.equal(res.status, 401);
});

test("authorization: patient cannot access admin-only routes", async () => {
  const email = uniqueEmail("patient");
  const registerRes = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password@123", role: "PATIENT", fullName: "Test Patient" }),
  });
  const token = registerRes.body.data.token;

  const res = await api("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 403);
});

test("double booking: second request for the identical slot is rejected", async () => {
  // NOTE: assumes a doctor named "Dr. Aditi Sharma" exists (from prisma/seed.js)
  // and a free upcoming slot at 10:00 for a chosen future date.
  // In a full CI setup this would look the doctor up dynamically; kept
  // simple here for interview-demo readability. See docs/testing-guide.md.

  const doctorsRes = await api("/api/doctors?search=Sharma");
  const doctor = doctorsRes.body.data.doctors[0];
  assert.ok(doctor, "Seed data must include Dr. Sharma — run `npm run seed` first.");

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const dateStr = futureDate.toISOString().slice(0, 10);

  const slotsRes = await api(`/api/doctors/${doctor.id}/availability?date=${dateStr}`);
  const slot = slotsRes.body.data.slots[0];
  assert.ok(slot, "Doctor must have at least one free slot on the test date.");

  async function registerPatient() {
    const email = uniqueEmail("racer");
    const r = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "Password@123", role: "PATIENT", fullName: "Racer" }),
    });
    return r.body.data.token;
  }

  const [tokenA, tokenB] = await Promise.all([registerPatient(), registerPatient()]);

  const bookPayload = {
    doctorId: doctor.id,
    appointmentDate: dateStr,
    startTime: slot.startTime,
    reasonForVisit: "Concurrent booking test",
  };

  // Fire both booking requests concurrently to simulate a race condition.
  const [resA, resB] = await Promise.all([
    api("/api/appointments", { method: "POST", headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify(bookPayload) }),
    api("/api/appointments", { method: "POST", headers: { Authorization: `Bearer ${tokenB}` }, body: JSON.stringify(bookPayload) }),
  ]);

  const statuses = [resA.status, resB.status].sort();
  // Exactly one must succeed (201) and the other must be rejected (409).
  assert.deepEqual(statuses, [201, 409]);
});

test("booking: cannot book a date in the past", async () => {
  const email = uniqueEmail("patient");
  const registerRes = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password@123", role: "PATIENT", fullName: "Test Patient" }),
  });
  const token = registerRes.body.data.token;

  const doctorsRes = await api("/api/doctors");
  const doctor = doctorsRes.body.data.doctors[0];

  const res = await api("/api/appointments", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ doctorId: doctor.id, appointmentDate: "2000-01-01", startTime: "09:00" }),
  });
  assert.equal(res.status, 400);
});
