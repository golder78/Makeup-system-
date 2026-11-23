import { prisma } from "../db/prisma.js";

const incomeFields = {
  bookingId: (value) => value === null || (Number.isInteger(value) && value > 0),
  clientId: (value) => value === null || (Number.isInteger(value) && value > 0),
  source: (value) => value === null || ["booking", "product_sale", "tip", "other"].includes(value),
  description: (value) => value === null || typeof value === "string",
  amount: (value) => value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0),
  paymentMethod: (value) =>
    value === null || ["cash", "mpesa", "card", "bank"].includes(value),
  paymentStatus: (value) => value === null || ["paid", "partial", "pending"].includes(value),
  date: (value) => value === null || (typeof value === "string" && !Number.isNaN(Date.parse(value))),
};

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseIncomeData(body, { creating = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const entries = Object.entries(body);
  if (entries.length === 0) {
    return { error: "Provide at least one income field." };
  }

  const data = {};
  for (const [field, value] of entries) {
    const validate = incomeFields[field];
    if (!validate) {
      return { error: `Unknown income field: ${field}.` };
    }
    if (!validate(value)) {
      return { error: `Invalid value for income field: ${field}.` };
    }
    data[field] = field === "date" && value !== null ? new Date(value) : value;
  }

  if (creating && (typeof data.source !== "string" || typeof data.amount !== "number")) {
    return { error: "Income source and amount are required." };
  }

  return { data };
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
    return res.status(400).json({ error: "Income id must be a positive integer." });
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
    return res.status(400).json({ error: "Income id must be a positive integer." });
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
    return res.status(400).json({ error: "Income id must be a positive integer." });
  }

  try {
    await prisma.income.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
