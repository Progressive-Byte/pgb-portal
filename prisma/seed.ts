import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const DEFAULT_LEAVE_TYPES = [
  { name: "Casual", defaultAnnualDays: 10 },
  { name: "Sick", defaultAnnualDays: 14 },
  { name: "Marriage", defaultAnnualDays: 3 },
  { name: "Maternity", defaultAnnualDays: 112 },
  { name: "Paternity", defaultAnnualDays: 7 },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@pgb.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      title: "Administrator",
      status: "ACTIVE",
    },
  });

  for (const leaveType of DEFAULT_LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {},
      create: leaveType,
    });
  }

  console.log(`Seeded admin user: ${admin.email} (password: ${adminPassword})`);
  console.log(`Seeded ${DEFAULT_LEAVE_TYPES.length} leave types.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
