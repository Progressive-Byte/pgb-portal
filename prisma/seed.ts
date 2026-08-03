import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { getWorkweekConfig, isWorkday, type WorkweekConfig } from "../src/lib/workweek";

const DEFAULT_LEAVE_TYPES = [
  { name: "Casual", defaultAnnualDays: 10 },
  { name: "Sick", defaultAnnualDays: 14 },
  { name: "Marriage", defaultAnnualDays: 3 },
  { name: "Maternity", defaultAnnualDays: 112 },
  { name: "Paternity", defaultAnnualDays: 7 },
];

const TASK_TYPES = ["Development", "Design", "QA", "Meeting", "Documentation"];
const PROJECTS = ["Website Redesign", "Mobile App", "Internal Tools", "Client Portal"];

const TASK_NAMES = [
  "Sprint planning follow-up",
  "Bug fix: login flow",
  "API integration work",
  "UI polish pass",
  "Client feedback review",
  "Code review",
  "Database migration cleanup",
  "Performance investigation",
  "Onboarding new teammate",
  "Writing test cases",
];

const TASK_NOTES = [
  "Completed as planned.",
  "Blocked briefly on review, resolved by EOD.",
  "Continuing tomorrow.",
  "Paired with a teammate on this.",
  "No blockers.",
  "Waiting on design feedback for the next step.",
];

const DEMO_PASSWORD = "Employee123!";
const DEMO_EMPLOYEES = [
  { name: "Aisha Rahman", email: "aisha@pgb.local" },
  { name: "Tanvir Hossain", email: "tanvir@pgb.local" },
  { name: "Nusrat Jahan", email: "nusrat@pgb.local" },
  { name: "Rifat Karim", email: "rifat@pgb.local" },
  { name: "Farhana Akter", email: "farhana@pgb.local" },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomHours() {
  return [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
}

function toUtcDate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Steps `count` workdays forward (negative = backward) from `start`, per the configured weekend pattern. */
function addWorkdays(start: Date, count: number, config: WorkweekConfig): Date {
  const d = toUtcDate(start);
  const step = count >= 0 ? 1 : -1;
  let remaining = Math.abs(count);
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + step);
    if (isWorkday(d, config)) remaining--;
  }
  return d;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@pgb.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
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
  const leaveTypes = await prisma.leaveType.findMany();

  const taskTypes = [];
  for (const name of TASK_TYPES) {
    taskTypes.push(
      await prisma.taskType.upsert({ where: { name }, update: {}, create: { name } }),
    );
  }

  const projects = [];
  for (const name of PROJECTS) {
    projects.push(
      await prisma.projectProduct.upsert({ where: { name }, update: {}, create: { name } }),
    );
  }

  const config = await getWorkweekConfig();
  const today = toUtcDate(new Date());
  // Leave "today" itself unfilled (demonstrates live missing-report behavior);
  // cover all of last month plus this month-to-date so either month picker
  // selection shows a fully populated view.
  const reportRangeEnd = addWorkdays(today, -1, config);
  const reportRangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));

  const holidayDate = addWorkdays(reportRangeStart, 8, config);
  await prisma.holiday.upsert({
    where: { date: holidayDate },
    update: {},
    create: { date: holidayDate, name: "Company Foundation Day" },
  });

  const existingPolicyCount = await prisma.policyDocument.count();
  if (existingPolicyCount === 0) {
    await prisma.policyDocument.createMany({
      data: [
        { title: "Employee Handbook", category: "HR", embedUrl: "https://example.com", sortOrder: 1 },
        { title: "Code of Conduct", category: "HR", embedUrl: "https://example.com", sortOrder: 2 },
        { title: "Leave Policy", category: "HR", embedUrl: "https://example.com", sortOrder: 3 },
        { title: "IT Security Guidelines", category: "IT", embedUrl: "https://example.com", sortOrder: 1 },
      ],
    });
  }

  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const employees = [];
  for (const emp of DEMO_EMPLOYEES) {
    employees.push(
      await prisma.user.upsert({
        where: { email: emp.email },
        update: {},
        create: {
          name: emp.name,
          email: emp.email,
          passwordHash: demoPasswordHash,
          role: "EMPLOYEE",
          status: "ACTIVE",
          joinDate: addWorkdays(reportRangeStart, -40, config),
        },
      }),
    );
  }
  const employeeIds = employees.map((e) => e.id);

  // Wipe and regenerate demo leave/task data so re-running the seed stays idempotent.
  await prisma.taskReport.deleteMany({ where: { userId: { in: employeeIds } } });
  await prisma.leaveRequest.deleteMany({ where: { userId: { in: employeeIds } } });

  const approvedLeaveByEmployee = new Map<string, string>();
  let leaveRequestsCreated = 0;

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];

    // One approved single-day leave, spread across the report window, avoiding the holiday.
    let approvedDate = addWorkdays(reportRangeStart, 2 + i * 3, config);
    if (isoDate(approvedDate) === isoDate(holidayDate)) {
      approvedDate = addWorkdays(approvedDate, 1, config);
    }
    approvedLeaveByEmployee.set(emp.id, isoDate(approvedDate));

    await prisma.leaveRequest.create({
      data: {
        userId: emp.id,
        leaveTypeId: randomFrom(leaveTypes).id,
        startDate: approvedDate,
        endDate: approvedDate,
        daysCount: 1,
        reason: "Personal errand",
        status: "APPROVED",
        reviewedBy: admin.id,
        reviewedAt: addWorkdays(approvedDate, -1, config),
        reviewNote: "Approved.",
        createdAt: addWorkdays(approvedDate, -2, config),
      },
    });
    leaveRequestsCreated++;

    // One pending request for an upcoming date, for the admin queue to show.
    const pendingStart = addWorkdays(today, 4 + i * 2, config);
    const pendingEnd = addWorkdays(pendingStart, 1, config);
    await prisma.leaveRequest.create({
      data: {
        userId: emp.id,
        leaveTypeId: randomFrom(leaveTypes).id,
        startDate: pendingStart,
        endDate: pendingEnd,
        daysCount: 2,
        reason: "Family event",
        status: "PENDING",
      },
    });
    leaveRequestsCreated++;

    // A rejected request for variety, on alternating employees.
    if (i % 2 === 0) {
      const rejectedDate = addWorkdays(reportRangeStart, -5 - i, config);
      await prisma.leaveRequest.create({
        data: {
          userId: emp.id,
          leaveTypeId: randomFrom(leaveTypes).id,
          startDate: rejectedDate,
          endDate: rejectedDate,
          daysCount: 1,
          reason: "Wanted a long weekend",
          status: "REJECTED",
          reviewedBy: admin.id,
          reviewedAt: addWorkdays(rejectedDate, 1, config),
          reviewNote: "Too many overlapping requests that week.",
          createdAt: addWorkdays(rejectedDate, -1, config),
        },
      });
      leaveRequestsCreated++;
    }
  }

  // Task reports across the report window. The first two employees have a gap in the
  // last few workdays so the "missing reports" dashboard has something to show.
  let reportsCreated = 0;
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const leaveDate = approvedLeaveByEmployee.get(emp.id);
    const gapStart = i < 2 ? addWorkdays(reportRangeEnd, -2, config) : null;

    const cursor = toUtcDate(reportRangeStart);
    while (cursor <= reportRangeEnd) {
      if (isWorkday(cursor, config)) {
        const dateStr = isoDate(cursor);
        const inGap = gapStart !== null && cursor >= gapStart;
        const onLeave = dateStr === leaveDate;
        const isHoliday = dateStr === isoDate(holidayDate);

        if (!inGap && !onLeave && !isHoliday) {
          const numTasks = Math.random() > 0.6 ? 2 : 1;
          for (let t = 0; t < numTasks; t++) {
            await prisma.taskReport.create({
              data: {
                userId: emp.id,
                date: new Date(dateStr),
                taskName: randomFrom(TASK_NAMES),
                taskTypeId: randomFrom(taskTypes).id,
                projectId: randomFrom(projects).id,
                hoursWorked: randomHours(),
                notes: randomFrom(TASK_NOTES),
              },
            });
            reportsCreated++;
          }
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  console.log(`Seeded admin user: ${admin.email} (password: ${adminPassword})`);
  console.log(`Seeded ${DEFAULT_LEAVE_TYPES.length} leave types, ${taskTypes.length} task types, ${projects.length} projects.`);
  console.log(`Seeded ${employees.length} demo employees (password: ${DEMO_PASSWORD}): ${DEMO_EMPLOYEES.map((e) => e.email).join(", ")}`);
  console.log(`Seeded ${reportsCreated} task reports and ${leaveRequestsCreated} leave requests across ${isoDate(reportRangeStart)} to ${isoDate(reportRangeEnd)}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
