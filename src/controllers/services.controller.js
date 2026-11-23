import { prisma } from "../db/prisma.js";
import { parseFields, parseId } from "../utils/helpers.js";

const isText = (value) => typeof value === "string" && value.trim() !== "";

const serviceFields = {
  name: isText,
  category: isText,
  description: (value) => value === null || typeof value === "string",
  price: (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0,
  durationMinutes: (value) => Number.isInteger(value) && value > 0,
  isActive: (value) => typeof value === "boolean",
};

// GET /api/services?active=true&category=makeup
export async function listServices(req, res, next) {
  const where = {};
  if (req.query.active !== undefined) {
    where.isActive = req.query.active === "true";
  }
  if (typeof req.query.category === "string" && req.query.category !== "") {
    where.category = req.query.category;
  }

  try {
    const services = await prisma.service.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json(services);
  } catch (error) {
    next(error);
  }
}

export async function getService(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Service id must be a positive integer." });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ error: "Service not found." });
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  const result = parseFields(req.body, serviceFields, {
    required: ["name", "category", "price", "durationMinutes"],
  });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const service = await prisma.service.create({ data: result.data });
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
}

export async function updateService(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Service id must be a positive integer." });
  }

  const result = parseFields(req.body, serviceFields, { requireAny: true });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const service = await prisma.service.update({
      where: { id },
      data: result.data,
    });
    res.json(service);
  } catch (error) {
    next(error);
  }
}

export async function deleteService(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Service id must be a positive integer." });
  }

  try {
    const inUse = await prisma.bookingService.count({
      where: { serviceId: id },
    });
    if (inUse > 0) {
      return res.status(409).json({
        error:
          "Service is used in bookings. Set isActive to false instead of deleting it.",
      });
    }

    await prisma.service.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
