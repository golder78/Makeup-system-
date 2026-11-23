import { Router } from "express";
import * as reportsRouter from "../controllers/reports.controller.js";

const router = Router();

// Live summary (not saved)
router.get("/summary", reportsRouter.getSummary);

// Saved report snapshots
router.get("/", reportsRouter.listReports);
router.post("/", reportsRouter.createReport);
router.get("/:id", reportsRouter.getReport);
router.delete("/:id", reportsRouter.deleteReport);

export default router;
