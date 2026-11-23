import { prisma } from "../db/prisma.js";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseClientData(body, { creating = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const fields = ["name", "contact", "skinType"];
  const entries = Object.entries(body);
  if (entries.length === 0) {
    return { error: "Provide at least one client field." };
  }

  const data = {};
  for (const [field, value] of entries) {
    if (!fields.includes(field)) {
      return { error: `Unknown client field: ${field}.` };
    }
    if (field === "name") {
      if (typeof value !== "string" || value.trim() === "") {
        return { error: "Client name must be a non-empty string." };
      }
      data.name = value.trim();
    } else if (value !== null && typeof value !== "string") {
      return { error: `Client ${field} must be a string or null.` };
    } else {
      data[field] = value;
    }
  }

  if (creating && !data.name) {
    return { error: "Client name is required." };
  }

  return { data };
}

export async function listClients(req, res, next) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

export async function getClient(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Client id must be a positive integer." });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!client) {
      return res.status(404).json({ error: "Client not found." });
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function createClient(req, res, next) {
  const result = parseClientData(req.body, { creating: true });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const client = await prisma.client.create({ data: result.data });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Client id must be a positive integer." });
  }

  const result = parseClientData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: result.data,
    });
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Client id must be a positive integer." });
  }

  try {
    await prisma.client.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
