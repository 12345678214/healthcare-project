const { PrismaClient } = require("@prisma/client");

// Single shared Prisma Client instance (recommended pattern).
// Re-using one instance avoids exhausting database connections.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
