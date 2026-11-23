// import { prisma } from "../db/prisma.js";
// import { calculateTotal, parseFields, parseId } from "../utils/helpers.js";

// const isPositiveInt = (value) => Number.isInteger(value) && value > 0;
// const isMoney = (value) =>
//   typeof value === "number" && Number.isFinite(value) && value >= 0;

// const addFields = {
//   serviceId: isPositiveInt,
//   quantity: isPositiveInt,
//   price: isMoney,
// };
// const updateFields = { quantity: isPositiveInt, price: isMoney };

// const bookingInclude = {
//   client: true,
//   services: { include: { service: true } },
// };

// // Recalculates booking.totalPrice from its booking services (run inside a transaction).
// async function refreshTotal(tx, bookingId) {
//   const items = await tx.bookingService.findMany({ where: { bookingId } });
//   return tx.booking.update({
//     where: { id: bookingId },
//     data: { totalPrice: calculateTotal(items) },
//     include: bookingInclude,
//   });
// }

// function readIds(req) {
//   return {
//     bookingId: parseId(req.params.bookingId),
//     id: req.params.id === undefined ? undefined : parseId(req.params.id),
//   };
// }

// // GET /api/bookings/:bookingId/services
// export async function listBookingServices(req, res, next) {
//   const { bookingId } = readIds(req);
//   if (bookingId === null) {
//     return res
//       .status(400)
//       .json({ error: "Booking id must be a positive integer." });
//   }

//   try {
//     const booking = await prisma.booking.findUnique({
//       where: { id: bookingId },
//       select: { id: true },
//     });
//     if (!booking) {
//       return res.status(404).json({ error: "Booking not found." });
//     }

//     const items = await prisma.bookingService.findMany({
//       where: { bookingId },
//       include: { service: true },
//       orderBy: { id: "asc" },
//     });
//     res.json(items);
//   } catch (error) {
//     next(error);
//   }
// }

// // POST /api/bookings/:bookingId/services  { serviceId, quantity?, price? }
// export async function addBookingService(req, res, next) {
//   const { bookingId } = readIds(req);
//   if (bookingId === null) {
//     return res
//       .status(400)
//       .json({ error: "Booking id must be a positive integer." });
//   }

//   const result = parseFields(req.body, addFields, { required: ["serviceId"] });
//   if (result.error) {
//     return res.status(400).json({ error: result.error });
//   }
//   const { serviceId, quantity = 1, price } = result.data;

//   try {
//     const booking = await prisma.booking.findUnique({
//       where: { id: bookingId },
//       select: { id: true },
//     });
//     if (!booking) {
//       return res.status(404).json({ error: "Booking not found." });
//     }

//     const service = await prisma.service.findUnique({
//       where: { id: serviceId },
//     });
//     if (!service || !service.isActive) {
//       return res.status(400).json({ error: "Service not found or inactive." });
//     }

//     const existing = await prisma.bookingService.findFirst({
//       where: { bookingId, serviceId },
//     });
//     if (existing) {
//       return res.status(409).json({
//         error:
//           "Service is already on this booking. Update its quantity instead.",
//       });
//     }

//     const updated = await prisma.$transaction(async (tx) => {
//       await tx.bookingService.create({
//         data: { bookingId, serviceId, quantity, price: price ?? service.price },
//       });
//       return refreshTotal(tx, bookingId);
//     });
//     res.status(201).json(updated);
//   } catch (error) {
//     next(error);
//   }
// }

// // PATCH /api/bookings/:bookingId/services/:id  { quantity?, price? }
// export async function updateBookingService(req, res, next) {
//   const { bookingId, id } = readIds(req);
//   if (bookingId === null || id === null) {
//     return res.status(400).json({ error: "Ids must be positive integers." });
//   }

//   const result = parseFields(req.body, updateFields, { requireAny: true });
//   if (result.error) {
//     return res.status(400).json({ error: result.error });
//   }

//   try {
//     const existing = await prisma.bookingService.findFirst({
//       where: { id, bookingId },
//     });
//     if (!existing) {
//       return res
//         .status(404)
//         .json({ error: "Service not found on this booking." });
//     }

//     const updated = await prisma.$transaction(async (tx) => {
//       await tx.bookingService.update({ where: { id }, data: result.data });
//       return refreshTotal(tx, bookingId);
//     });
//     res.json(updated);
//   } catch (error) {
//     next(error);
//   }
// }

// // DELETE /api/bookings/:bookingId/services/:id  (returns the updated booking)
// export async function removeBookingService(req, res, next) {
//   const { bookingId, id } = readIds(req);
//   if (bookingId === null || id === null) {
//     return res.status(400).json({ error: "Ids must be positive integers." });
//   }

//   try {
//     const existing = await prisma.bookingService.findFirst({
//       where: { id, bookingId },
//     });
//     if (!existing) {
//       return res
//         .status(404)
//         .json({ error: "Service not found on this booking." });
//     }

//     const updated = await prisma.$transaction(async (tx) => {
//       await tx.bookingService.delete({ where: { id } });
//       return refreshTotal(tx, bookingId);
//     });
//     res.json(updated);
//   } catch (error) {
//     next(error);
//   }
// }
