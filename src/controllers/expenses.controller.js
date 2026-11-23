import { prisma } from "../db/prisma.js";

const expenseCategories = [
  "products",
  "rent",
  "transport",
  "salaries",
  "marketing",
  "utilities",
];
const paymentMethods = ["cash", "mpesa", "card", "bank"];

const expenseFields = {
  inventoryId: (value) => value === null || (Number.isInteger(value) && value > 0),
  category: (value) => value === null || expenseCategories.includes(value),
  description: (value) => value === null || typeof value === "string",
  amount: (value) => value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0),
  paymentMethod: (value) => value === null || paymentMethods.includes(value),
  supplier: (value) => value === null || typeof value === "string",
  receiptNo: (value) => value === null || typeof value === "string",
  date: (value) => value === null || (typeof value === "string" && !Number.isNaN(Date.parse(value))),
};

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseExpenseData(body, { creating = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const entries = Object.entries(body);
  if (entries.length === 0) {
    return { error: "Provide at least one expense field." };
  }

  const data = {};
  for (const [field, value] of entries) {
    const validate = expenseFields[field];
    if (!validate) {
      return { error: `Unknown expense field: ${field}.` };
    }
    if (!validate(value)) {
      return { error: `Invalid value for expense field: ${field}.` };
    }
    data[field] = field === "date" && value !== null ? new Date(value) : value;
  }

  if (creating && (typeof data.category !== "string" || typeof data.amount !== "number")) {
    return { error: "Expense category and amount are required." };
  }

  return { data };
}

export async function listExpenses(req, res, next) {
  try {
    const expenses = await prisma.expense.findMany({
      include: { inventory: true },
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getExpense(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Expense id must be a positive integer." });
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { inventory: true },
    });
    if (!expense) {
      return res.status(404).json({ error: "Expense record not found." });
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req, res, next) {
  const result = parseExpenseData(req.body, { creating: true });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const expense = await prisma.expense.create({
      data: result.data,
      include: { inventory: true },
    });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Expense id must be a positive integer." });
  }

  const result = parseExpenseData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: result.data,
      include: { inventory: true },
    });
    res.json(expense);
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Expense id must be a positive integer." });
  }

  try {
    await prisma.expense.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
