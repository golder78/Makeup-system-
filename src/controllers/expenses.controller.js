import { prisma } from "../db/prisma.js";
import { parseId, parseFields } from "../utils/helpers.js";

const expenseCategories = [
  "products",
  "rent",
  "transport",
  "salaries",
  "marketing",
  "utilities",
];
const paymentMethods = ["cash", "mpesa", "card", "bank"];

const isDateString = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const expenseFields = {
  inventoryId: (value) =>
    value === null || (Number.isInteger(value) && value > 0),
  category: (value) => value === null || expenseCategories.includes(value),
  description: (value) => value === null || typeof value === "string",
  amount: (value) =>
    value === null ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0),
  paymentMethod: (value) => value === null || paymentMethods.includes(value),
  supplier: (value) => value === null || typeof value === "string",
  receiptNo: (value) => value === null || typeof value === "string",
  date: (value) => value === null || isDateString(value),
};

function parseExpenseData(body, { creating = false } = {}) {
  const result = parseFields(
    body,
    expenseFields,
    creating ? { required: ["category", "amount"] } : { requireAny: true },
  );
  if (result.error) return result;

  if (typeof result.data.date === "string") {
    result.data.date = new Date(result.data.date);
  }
  return result;
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
    return res
      .status(400)
      .json({ error: "Expense id must be a positive integer." });
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
    return res
      .status(400)
      .json({ error: "Expense id must be a positive integer." });
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
    return res
      .status(400)
      .json({ error: "Expense id must be a positive integer." });
  }

  try {
    await prisma.expense.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
