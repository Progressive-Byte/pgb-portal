import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: "from and to query params are required" }, { status: 400 });
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  const [employees, leaveTypes, requests] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", status: { in: ["ACTIVE", "DISABLED"] } },
      orderBy: { name: "asc" },
    }),
    prisma.leaveType.findMany({ orderBy: { name: "asc" } }),
    prisma.leaveRequest.findMany({
      where: {
        startDate: { gte: from },
        endDate: { lte: to },
        user: { role: "EMPLOYEE" },
      },
      include: { user: true, leaveType: true, reviewer: true },
      orderBy: [{ user: { name: "asc" } }, { startDate: "asc" }],
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PGB Portal";
  workbook.created = new Date();

  // --- Summary sheet: employee x leave type matrix, approved days only ---
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Employee", key: "name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    ...leaveTypes.map((t) => ({ header: t.name, key: t.id, width: 14 })),
    { header: "Total", key: "total", width: 10 },
  ];
  summarySheet.getRow(1).font = { bold: true };

  const usedByUserType = new Map<string, Map<string, number>>();
  for (const req of requests) {
    if (req.status !== "APPROVED") continue;
    if (!usedByUserType.has(req.userId)) usedByUserType.set(req.userId, new Map());
    const m = usedByUserType.get(req.userId)!;
    m.set(req.leaveTypeId, (m.get(req.leaveTypeId) ?? 0) + req.daysCount);
  }

  for (const emp of employees) {
    const m = usedByUserType.get(emp.id) ?? new Map<string, number>();
    const row: Record<string, string | number> = { name: emp.name, email: emp.email };
    let total = 0;
    for (const type of leaveTypes) {
      const days = m.get(type.id) ?? 0;
      row[type.id] = days;
      total += days;
    }
    row.total = total;
    summarySheet.addRow(row);
  }

  // --- Details sheet: one row per leave request, every status, full audit trail ---
  const detailsSheet = workbook.addWorksheet("Details");
  detailsSheet.columns = [
    { header: "Employee", key: "employee", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Leave Type", key: "leaveType", width: 16 },
    { header: "Start Date", key: "startDate", width: 14 },
    { header: "End Date", key: "endDate", width: 14 },
    { header: "Days", key: "days", width: 8 },
    { header: "Status", key: "status", width: 12 },
    { header: "Reason", key: "reason", width: 36 },
    { header: "Reviewed By", key: "reviewedBy", width: 20 },
    { header: "Reviewed At", key: "reviewedAt", width: 14 },
    { header: "Review Note", key: "reviewNote", width: 30 },
  ];
  detailsSheet.getRow(1).font = { bold: true };

  for (const req of requests) {
    detailsSheet.addRow({
      employee: req.user.name,
      email: req.user.email,
      leaveType: req.leaveType.name,
      startDate: req.startDate.toISOString().slice(0, 10),
      endDate: req.endDate.toISOString().slice(0, 10),
      days: req.daysCount,
      status: req.status,
      reason: req.reason,
      reviewedBy: req.reviewer?.name ?? "",
      reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString().slice(0, 10) : "",
      reviewNote: req.reviewNote ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `leave-export-${fromParam}-to-${toParam}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
