import { prisma } from "../db/prisma.js";
import { parseFields, parseId, round2 } from "../utils/helpers.js";

const REPORT_TYPES = ["daily", "weekly", "monthly", "yearly", "custom"];

const isDateString = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const reportFields = {
  reportType: (value) => REPORT_TYPES.includes(value),
  periodStart: isDateString,
  periodEnd: isDateString,
  generatedBy: (value) => value === null || typeof value === "string",
};

// Dates are inclusive: "to" covers the whole day.
function parseRange(from, to) {
  if (!isDateString(from) || !isDateString(to)) {
    return { error: "Provide valid from and to dates (YYYY-MM-DD)." };
  }

  const start = new Date(from);
  const end = new Date(to);
  if (start > end) {
    return { error: "from must not be after to." };
  }

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, end, endExclusive };
}

// Income that is still "pending" has not been received, so it is not counted.
async function buildSummary(start, endExclusive) {
  const range = { gte: start, lt: endExclusive };
  const incomeWhere = { date: range, paymentStatus: { not: "pending" } };
  const expenseWhere = { date: range };

  const [
    income,
    expenses,
    incomeByMethod,
    expensesByCategory,
    completedBookings,
  ] = await Promise.all([
    prisma.income.aggregate({ where: incomeWhere, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
    prisma.income.groupBy({
      by: ["paymentMethod"],
      where: incomeWhere,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: expenseWhere,
      _sum: { amount: true },
    }),
    prisma.booking.count({ where: { status: "completed", date: range } }),
  ]);

  const totalIncome = round2(income._sum.amount);
  const totalExpenses = round2(expenses._sum.amount);

  return {
    totalIncome,
    totalExpenses,
    netProfit: round2(totalIncome - totalExpenses),
    totalBookings: completedBookings,
    incomeByPaymentMethod: incomeByMethod.map((row) => ({
      paymentMethod: row.paymentMethod,
      total: round2(row._sum.amount),
    })),
    expensesByCategory: expensesByCategory.map((row) => ({
      category: row.category,
      total: round2(row._sum.amount),
    })),
  };
}

// GET /api/reports/summary?from=2026-11-01&to=2026-11-30  (calculated live, not saved)
export async function getSummary(req, res, next) {
  const range = parseRange(req.query.from, req.query.to);
  if (range.error) {
    return res.status(400).json({ error: range.error });
  }

  try {
    const summary = await buildSummary(range.start, range.endExclusive);
    res.json({ from: req.query.from, to: req.query.to, ...summary });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports?reportType=monthly
export async function listReports(req, res, next) {
  const where = {};
  if (req.query.reportType !== undefined) {
    if (!REPORT_TYPES.includes(req.query.reportType)) {
      return res.status(400).json({
        error: `reportType must be one of: ${REPORT_TYPES.join(", ")}.`,
      });
    }
    where.reportType = req.query.reportType;
  }

  try {
    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export async function getReport(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Report id must be a positive integer." });
  }

  try {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
}

// POST /api/reports  { reportType, periodStart, periodEnd, generatedBy? }
// Calculates the totals for the period and saves them as a snapshot.
export async function createReport(req, res, next) {
  const result = parseFields(req.body, reportFields, {
    required: ["reportType", "periodStart", "periodEnd"],
  });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const range = parseRange(result.data.periodStart, result.data.periodEnd);
  if (range.error) {
    return res.status(400).json({ error: range.error });
  }

  try {
    const summary = await buildSummary(range.start, range.endExclusive);

    const report = await prisma.report.create({
      data: {
        reportType: result.data.reportType,
        periodStart: range.start,
        periodEnd: range.end,
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        netProfit: summary.netProfit,
        totalBookings: summary.totalBookings,
        generatedBy: result.data.generatedBy ?? null,
      },
    });

    res.status(201).json({
      ...report,
      incomeByPaymentMethod: summary.incomeByPaymentMethod,
      expensesByCategory: summary.expensesByCategory,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReport(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Report id must be a positive integer." });
  }

  try {
    await prisma.report.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
