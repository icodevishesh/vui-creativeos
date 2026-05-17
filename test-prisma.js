const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.$connect();
    console.log("Connected successfully to server");
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
