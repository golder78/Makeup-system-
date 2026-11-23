import { prisma } from "../db/prisma.js";
import { parseId, parseFields } from "../utils/helpers.js";

const isText = (value) => typeof value === "string" && value.trim() !== "";

const clientFields = {
  name: isText,
  contact: (value) => value === null || typeof value === "string",
  skinType: (value) => value === null || typeof value === "string",
};

function parseClientData(body, { creating = false } = {}) {
  const result = parseFields(
    body,
    clientFields,
    creating ? { required: ["name"] } : { requireAny: true },
  );
  if (result.error) return result;

  if (result.data.name !== undefined) {
    result.data.name = result.data.name.trim();
  }
  return result;
}

export async function listClients(req, res, next) {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

export async function getClient(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Client id must be a positive integer." });
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
    return res
      .status(400)
      .json({ error: "Client id must be a positive integer." });
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
    return res
      .status(400)
      .json({ error: "Client id must be a positive integer." });
  }

  try {
    await prisma.client.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
