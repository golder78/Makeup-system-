import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
} from "../controllers/expenses.controller.js";

const router = Router();

router.get("/", listExpenses);
router.get("/:id", getExpense);
router.post("/", createExpense);
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
