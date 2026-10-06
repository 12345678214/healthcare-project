const app = require("./app");
const { port, enableReminderCron } = require("./config/env");
const prisma = require("./config/db");
const { startReminderJob } = require("./jobs/reminderJob");

async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected."); // eslint-disable-line no-console

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`); // eslint-disable-line no-console
    });

    if (enableReminderCron) {
      startReminderJob();
    } else {
      console.log("Reminder job disabled (ENABLE_REMINDER_CRON=false)."); // eslint-disable-line no-console
    }
  } catch (err) {
    console.error("Failed to start server:", err); // eslint-disable-line no-console
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
