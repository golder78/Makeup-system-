import { Router } from "express";
import {
  createBooking,
  deleteBooking,
  getBooking,
  listBookings,
  updateBooking,
} from "../controllers/bookings.controller.js";

const router = Router();

router.get("/", listBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.patch("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
