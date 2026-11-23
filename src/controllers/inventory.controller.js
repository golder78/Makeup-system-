import { prisma } from "../db/prisma.js";

const inventoryFields = ["name", "brand", "quantity", "category", "expiryDate"];

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseInventoryData(body, { creating = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const entries = Object.entries(body);
  if (entries.length === 0) {
    return { error: "Provide at least one inventory field." };
  }

  const data = {};
  for (const [field, value] of entries) {
    if (!inventoryFields.includes(field)) {
      return { error: `Unknown inventory field: ${field}.` };
    }

    if (field === "name") {
      if (typeof value !== "string" || value.trim() === "") {
        return { error: "Inventory name must be a non-empty string." };
      }
      data.name = value.trim();
    } else if (field === "quantity") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return { error: "Inventory quantity must be a non-negative number." };
      }
      data.quantity = value;
    } else if (field === "expiryDate") {
      if (value === null) {
        data.expiryDate = null;
      } else if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
        data.expiryDate = new Date(value);
      } else {
        return { error: "Inventory expiryDate must be a valid date string or null." };
      }
    } else if (value !== null && typeof value !== "string") {
      return { error: `Inventory ${field} must be a string or null.` };
    } else {
      data[field] = value;
    }
  }

  if (creating && (typeof data.name !== "string" || typeof data.quantity !== "number")) {
    return { error: "Inventory name and quantity are required." };
  }

  return { data };
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
    return res.status(400).json({ error: "Inventory id must be a positive integer." });
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
    return res.status(400).json({ error: "Inventory id must be a positive integer." });
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
    return res.status(400).json({ error: "Inventory id must be a positive integer." });
  }

  try {
    await prisma.inventory.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
