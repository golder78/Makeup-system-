import { prisma } from "../db/prisma.js";
import { parseId, parseFields } from "../utils/helpers.js";

const isDateString = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const inventoryFields = {
  name: (value) => typeof value === "string" && value.trim() !== "",
  brand: (value) => value === null || typeof value === "string",
  quantity: (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0,
  category: (value) => value === null || typeof value === "string",
  expiryDate: (value) => value === null || isDateString(value),
};

function parseInventoryData(body, { creating = false } = {}) {
  const result = parseFields(
    body,
    inventoryFields,
    creating ? { required: ["name", "quantity"] } : { requireAny: true },
  );
  if (result.error) return result;

  if (result.data.name !== undefined) {
    result.data.name = result.data.name.trim();
  }
  if (typeof result.data.expiryDate === "string") {
    result.data.expiryDate = new Date(result.data.expiryDate);
  }
  return result;
}

export async function listInventory(req, res, next) {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: { name: "asc" },
    });
    res.json(inventory);
  } catch (error) {
    next(error);
  }
}

export async function getInventoryItem(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Inventory id must be a positive integer." });
  }

  try {
    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found." });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function createInventoryItem(req, res, next) {
  const result = parseInventoryData(req.body, { creating: true });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const item = await prisma.inventory.create({ data: result.data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateInventoryItem(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Inventory id must be a positive integer." });
  }

  const result = parseInventoryData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const item = await prisma.inventory.update({
      where: { id },
      data: result.data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function deleteInventoryItem(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Inventory id must be a positive integer." });
  }

  try {
    await prisma.inventory.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
