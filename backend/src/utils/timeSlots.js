// Helper functions for generating and comparing HH:MM time slots.
// Kept dependency-free (no date libraries) for simplicity.

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Given a window (e.g. 09:00-13:00) and a slot duration, generate
// all candidate start/end slot pairs.
function generateSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  let cursor = toMinutes(startTime);
  const end = toMinutes(endTime);

  while (cursor + durationMinutes <= end) {
    slots.push({
      startTime: toHHMM(cursor),
      endTime: toHHMM(cursor + durationMinutes),
    });
    cursor += durationMinutes;
  }
  return slots;
}

module.exports = { toMinutes, toHHMM, generateSlots };
