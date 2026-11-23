import { prisma } from "../db/prisma.js";

const bookingFields = {
  clientId: (value) => value === null || (Number.isInteger(value) && value > 0),
  location: (value) => value === null || typeof value === "string",
  totalPrice: (value) => value === null || (typeof value === "number" && Number.isFinite(value)),
  deposit: (value) => value === null || (typeof value === "number" && Number.isFinite(value)),
  status: (value) =>
    value === null || ["pending", "confirmed", "completed", "cancelled"].includes(value),
  date: (value) =>
    value === null ||
    (typeof value === "string" && !Number.isNaN(Date.parse(value))),
  notes: (value) => value === null || typeof value === "string",
};

function parseBookingData(body, { allowEmpty = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const entries = Object.entries(body);
  if (!allowEmpty && entries.length === 0) {
    return { error: "Provide at least one booking field." };
  }

  const data = {};
  for (const [field, value] of entries) {
    const validate = bookingFields[field];
    if (!validate) {
      return { error: `Unknown booking field: ${field}.` };
    }
    if (!validate(value)) {
      return { error: `Invalid value for booking field: ${field}.` };
    }
    data[field] = field === "date" && value !== null ? new Date(value) : value;
  }

  return { data };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      include: { client: true },
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
    return res.status(400).json({ error: "Booking id must be a positive integer." });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { client: true },
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
  const result = parseBookingData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const booking = await prisma.booking.create({
      data: result.data,
      include: { client: true },
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

export async function updateBooking(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Booking id must be a positive integer." });
  }

  const result = parseBookingData(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: result.data,
      include: { client: true },
    });
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function deleteBooking(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Booking id must be a positive integer." });
  }

  try {
    await prisma.booking.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
