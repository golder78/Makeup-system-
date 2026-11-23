import { prisma } from "../db/prisma.js";
import { calculateTotal, parseFields, parseId } from "../utils/helpers.js";

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

// totalPrice is not accepted from the client: it is calculated from the
// booking's services.
const bookingFields = {
  clientId: (value) => Number.isInteger(value) && value > 0,
  location: (value) => typeof value === "string" && value.trim() !== "",
  deposit: (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0,
  status: (value) => BOOKING_STATUSES.includes(value),
  date: (value) =>
    typeof value === "string" && !Number.isNaN(Date.parse(value)),
  notes: (value) => value === null || typeof value === "string",
};

const bookingInclude = {
  client: true,
  services: { include: { service: true } },
};

function parseServiceItems(value) {
  if (!Array.isArray(value)) {
    return { error: "services must be an array." };
  }

  const seen = new Set();
  const items = [];
  for (const item of value) {
    const serviceId = item?.serviceId;
    const quantity = item?.quantity ?? 1;

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return { error: "Each service needs a positive integer serviceId." };
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Each service quantity must be a positive integer." };
    }
    if (seen.has(serviceId)) {
      return {
        error: `Service ${serviceId} is listed twice; use quantity instead.`,
      };
    }

    seen.add(serviceId);
    items.push({ serviceId, quantity });
  }

  return { items };
}

function parseBookingData(body, { isCreate = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const { services, ...fields } = body;

  if ("totalPrice" in fields) {
    return {
      error:
        "totalPrice is calculated from the booking's services and cannot be set.",
    };
  }
  if (!isCreate && services !== undefined) {
    return { error: "Change services with /api/bookings/:id/services." };
  }

  const parsed = parseFields(
    fields,
    bookingFields,
    isCreate
      ? { required: ["clientId", "location", "date"] }
      : { requireAny: true },
  );
  if (parsed.error) {
    return parsed;
  }

  const data = parsed.data;
  if (data.date !== undefined) {
    data.date = new Date(data.date);
  }

  let items = [];
  if (services !== undefined) {
    const parsedItems = parseServiceItems(services);
    if (parsedItems.error) {
      return parsedItems;
    }
    items = parsedItems.items;
  }

  return { data, items };
}

// Looks up current prices; every service must exist and be active.
async function priceServiceItems(items) {
  const services = await prisma.service.findMany({
    where: { id: { in: items.map((item) => item.serviceId) }, isActive: true },
  });
  const priceById = new Map(
    services.map((service) => [service.id, service.price]),
  );

  const missing = items
    .filter((item) => !priceById.has(item.serviceId))
    .map((item) => item.serviceId);
  if (missing.length > 0) {
    return {
      error: `Unknown or inactive service id(s): ${missing.join(", ")}.`,
    };
  }

  return {
    rows: items.map((item) => ({
      ...item,
      price: priceById.get(item.serviceId),
    })),
  };
}

export async function listBookings(req, res, next) {
  const where = {};
  if (req.query.status !== undefined) {
    if (!BOOKING_STATUSES.includes(req.query.status)) {
      return res.status(400).json({
        error: `status must be one of: ${BOOKING_STATUSES.join(", ")}.`,
      });
    }
    where.status = req.query.status;
  }

  try {
    const bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { date: "asc" },
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Booking id must be a positive integer." });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function createBooking(req, res, next) {
  const result = parseBookingData(req.body, { isCreate: true });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    let rows = [];
    if (result.items.length > 0) {
      const priced = await priceServiceItems(result.items);
      if (priced.error) {
        return res.status(400).json({ error: priced.error });
      }
      rows = priced.rows;
    }

    const booking = await prisma.booking.create({
      data: {
        ...result.data,
        totalPrice: calculateTotal(rows),
        services: { create: rows },
      },
      include: bookingInclude,
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

export async function updateBooking(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Booking id must be a positive integer." });
  }

  const result = parseBookingData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: result.data,
      include: bookingInclude,
    });
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function deleteBooking(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ error: "Booking id must be a positive integer." });
  }

  try {
    await prisma.booking.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
