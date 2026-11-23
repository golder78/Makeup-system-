import { prisma } from "../db/prisma.js";
import { parseId, parseFields } from "../utils/helpers.js";

const isDateString = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const incomeFields = {
  bookingId: (value) =>
    value === null || (Number.isInteger(value) && value > 0),
  clientId: (value) => value === null || (Number.isInteger(value) && value > 0),
  source: (value) =>
    value === null ||
    ["booking", "product_sale", "tip", "other"].includes(value),
  description: (value) => value === null || typeof value === "string",
  amount: (value) =>
    value === null ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0),
  paymentMethod: (value) =>
    value === null || ["cash", "mpesa", "card", "bank"].includes(value),
  paymentStatus: (value) =>
    value === null || ["paid", "partial", "pending"].includes(value),
  date: (value) => value === null || isDateString(value),
};

function parseIncomeData(body, { creating = false } = {}) {
  const result = parseFields(
    body,
    incomeFields,
    creating ? { required: ["source", "amount"] } : { requireAny: true },
  );
  if (result.error) return result;

  if (typeof result.data.date === "string") {
    result.data.date = new Date(result.data.date);
  }
  return result;
}

export async function listIncome(req, res, next) {
  try {
    const income = await prisma.income.findMany({
      include: { booking: true, client: true },
      orderBy: { date: "desc" },
    });
    res.json(income);
  } catch (error) {
    next(error);
  }
}

export async function getIncome(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Income id must be a positive integer." });
  }

  try {
    const income = await prisma.income.findUnique({
      where: { id },
      include: { booking: true, client: true },
    });
    if (!income) {
      return res.status(404).json({ error: "Income record not found." });
    }
    res.json(income);
  } catch (error) {
    next(error);
  }
}

export async function createIncome(req, res, next) {
  const result = parseIncomeData(req.body, { creating: true });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const income = await prisma.income.create({
      data: result.data,
      include: { booking: true, client: true },
    });
    res.status(201).json(income);
  } catch (error) {
    next(error);
  }
}

export async function updateIncome(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Income id must be a positive integer." });
  }

  const result = parseIncomeData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const income = await prisma.income.update({
      where: { id },
      data: result.data,
      include: { booking: true, client: true },
    });
    res.json(income);
  } catch (error) {
    next(error);
  }
}

export async function deleteIncome(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Income id must be a positive integer." });
  }

  try {
    await prisma.income.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
