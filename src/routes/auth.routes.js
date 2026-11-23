import { Router } from "express";
import * as authRouter from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.post("/login", authRouter.login);
router.post("/logout", authRouter.logout);

router.get("/me", requireAuth, authRouter.me);

export default router;
