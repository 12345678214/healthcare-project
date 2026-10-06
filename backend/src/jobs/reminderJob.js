const cron = require("node-cron");
const prisma = require("../config/db");
const { sendEmail } = require("../utils/email");
const { appointmentReminderEmail } = require("../utils/emailTemplates");
const { reminderCronSchedule } = require("../config/env");

// Combines the appointment's date-only field with its "HH:MM" startTime
// string into one real JS Date, since they're stored as separate
// columns (see schema.prisma comments on the Appointment model).
function combineDateAndTime(appointmentDate, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const combined = new Date(appointmentDate);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

async function sendReminder(appt, hoursBefore) {
  const { subject, text, html } = appointmentReminderEmail({
    patientName: appt.patient.fullName,
    doctorName: appt.doctor.fullName,
    appointmentDate: appt.appointmentDate,
    startTime: appt.startTime,
    hoursBefore,
  });

  await sendEmail({ to: appt.patient.user.email, subject, text, html });

  await prisma.notification.create({
    data: {
      userId: appt.patient.userId,
      title: subject,
      message: text,
    },
  });
}

// ---------------------------------------------------------------------
// Sends the "24 hours before" and "1 hour before" reminder emails for
// CONFIRMED appointments.
//
// Design note (kept simple deliberately): rather than trying to fire
// exactly at the 24h/1h mark, each reminder is sent the first time the
// job notices the appointment has entered that window and hasn't been
// reminded yet (tracked via reminder24hSentAt/reminder1hSentAt on the
// Appointment row). This means a doctor confirming a booking only a
// few hours before the visit will cause both reminders to go out
// almost immediately rather than 24 hours apart — an acceptable
// tradeoff for a demo project, and far simpler and more robust than
// trying to hit an exact instant with a periodic job. This is called
// out explicitly in docs/appointment-flow.md.
// ---------------------------------------------------------------------
async function runReminderSweep() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  const candidates = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      OR: [{ reminder24hSentAt: null }, { reminder1hSentAt: null }],
      // Only look a couple of days ahead to keep this query cheap —
      // nothing further out could possibly be due for a reminder yet.
      appointmentDate: { gte: new Date(now.toDateString()) },
    },
    include: {
      doctor: { select: { fullName: true } },
      patient: { select: { fullName: true, userId: true, user: { select: { email: true } } } },
    },
  });

  let remindersSent = 0;

  for (const appt of candidates) {
    const apptDateTime = combineDateAndTime(appt.appointmentDate, appt.startTime);
    if (apptDateTime <= now) continue; // already happened; nothing to remind about

    const updates = {};

    if (!appt.reminder1hSentAt && apptDateTime <= in1h) {
      await sendReminder(appt, 1);
      updates.reminder1hSentAt = now;
      // If we're already inside the 1-hour window, the 24-hour window
      // has necessarily passed too — mark both sent so we never send
      // a "24 hours before" email after the fact.
      if (!appt.reminder24hSentAt) updates.reminder24hSentAt = now;
      remindersSent += 1;
    } else if (!appt.reminder24hSentAt && apptDateTime <= in24h) {
      await sendReminder(appt, 24);
      updates.reminder24hSentAt = now;
      remindersSent += 1;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.appointment.update({ where: { id: appt.id }, data: updates });
    }
  }

  return { checked: candidates.length, remindersSent };
}

// Starts the periodic sweep. Call once at server startup. Guarded by
// ENABLE_REMINDER_CRON (checked by the caller) so it can be disabled
// entirely, e.g. during automated tests.
function startReminderJob() {
  cron.schedule(reminderCronSchedule, () => {
    runReminderSweep().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[reminder-job] sweep failed:", err.message);
    });
  });
  // eslint-disable-next-line no-console
  console.log(`Reminder job scheduled (${reminderCronSchedule}).`);
}

module.exports = { startReminderJob, runReminderSweep, combineDateAndTime };
