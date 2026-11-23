import { Router } from "express";
import {
  createIncome,
  deleteIncome,
  getIncome,
  listIncome,
  updateIncome,
} from "../controllers/income.controller.js";

const router = Router();

router.get("/", listIncome);
router.get("/:id", getIncome);
router.post("/", createIncome);
router.patch("/:id", updateIncome);
router.delete("/:id", deleteIncome);

export default router;
