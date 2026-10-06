// Plain-text (with a light HTML variant) email bodies for the three
// appointment lifecycle events that notify a patient by email.
// Kept as simple template functions rather than a templating engine —
// there are only three, and this keeps the project dependency-light.

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function appointmentConfirmedEmail({ patientName, doctorName, specializationNames, appointmentDate, startTime, fee }) {
  const subject = "Your appointment has been confirmed";
  const dateStr = formatDate(appointmentDate);
  const text =
    `Hi ${patientName},\n\n` +
    `Good news — your appointment has been CONFIRMED by the doctor.\n\n` +
    `Doctor: Dr. ${doctorName}${specializationNames ? ` (${specializationNames})` : ""}\n` +
    `Date: ${dateStr}\n` +
    `Time: ${startTime}\n` +
    (fee ? `Consultation fee: ₹${fee}\n` : "") +
    `\nPlease arrive a few minutes early. If you need to reschedule or cancel, you can do so from your dashboard.\n\n` +
    `— MediCare Connect`;
  const html = `<p>Hi ${patientName},</p><p>Good news — your appointment has been <strong>CONFIRMED</strong> by the doctor.</p>
    <ul><li><strong>Doctor:</strong> Dr. ${doctorName}${specializationNames ? ` (${specializationNames})` : ""}</li>
    <li><strong>Date:</strong> ${dateStr}</li><li><strong>Time:</strong> ${startTime}</li>
    ${fee ? `<li><strong>Consultation fee:</strong> ₹${fee}</li>` : ""}</ul>
    <p>Please arrive a few minutes early. If you need to reschedule or cancel, you can do so from your dashboard.</p>
    <p>— MediCare Connect</p>`;
  return { subject, text, html };
}

function appointmentRejectedEmail({ patientName, doctorName, appointmentDate, startTime }) {
  const subject = "Your appointment request was declined";
  const dateStr = formatDate(appointmentDate);
  const text =
    `Hi ${patientName},\n\n` +
    `Unfortunately, Dr. ${doctorName} was unable to accept your appointment request for ${dateStr} at ${startTime}.\n\n` +
    `Please feel free to book a different time slot or another doctor from your dashboard.\n\n` +
    `— MediCare Connect`;
  const html = `<p>Hi ${patientName},</p><p>Unfortunately, Dr. ${doctorName} was unable to accept your appointment request for
    <strong>${dateStr} at ${startTime}</strong>.</p><p>Please feel free to book a different time slot or another doctor from your dashboard.</p>
    <p>— MediCare Connect</p>`;
  return { subject, text, html };
}

function appointmentCancelledEmail({ patientName, doctorName, appointmentDate, startTime, cancelledBy }) {
  const subject = "Your appointment has been cancelled";
  const dateStr = formatDate(appointmentDate);
  const by = cancelledBy === "DOCTOR" ? "the doctor" : "you";
  const text =
    `Hi ${patientName},\n\n` +
    `Your appointment with Dr. ${doctorName} on ${dateStr} at ${startTime} has been cancelled by ${by}.\n\n` +
    `You can book a new appointment anytime from your dashboard.\n\n` +
    `— MediCare Connect`;
  const html = `<p>Hi ${patientName},</p><p>Your appointment with Dr. ${doctorName} on <strong>${dateStr} at ${startTime}</strong>
    has been cancelled by ${by}.</p><p>You can book a new appointment anytime from your dashboard.</p>
    <p>— MediCare Connect</p>`;
  return { subject, text, html };
}

function appointmentReminderEmail({ patientName, doctorName, appointmentDate, startTime, hoursBefore }) {
  const subject = hoursBefore === 24 ? "Reminder: appointment tomorrow" : "Reminder: appointment in 1 hour";
  const dateStr = formatDate(appointmentDate);
  const text =
    `Hi ${patientName},\n\n` +
    `This is a reminder that you have an appointment with Dr. ${doctorName} ` +
    `${hoursBefore === 24 ? "tomorrow" : "in about 1 hour"} — ${dateStr} at ${startTime}.\n\n` +
    `— MediCare Connect`;
  const html = `<p>Hi ${patientName},</p><p>This is a reminder that you have an appointment with Dr. ${doctorName}
    ${hoursBefore === 24 ? "tomorrow" : "in about 1 hour"} — <strong>${dateStr} at ${startTime}</strong>.</p>
    <p>— MediCare Connect</p>`;
  return { subject, text, html };
}

module.exports = {
  appointmentConfirmedEmail,
  appointmentRejectedEmail,
  appointmentCancelledEmail,
  appointmentReminderEmail,
};
