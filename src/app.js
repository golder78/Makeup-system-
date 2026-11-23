import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "node:url";
import bookingsRouter from "./routes/bookings.routes.js";
import clientsRouter from "./routes/clients.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";
import incomeRouter from "./routes/income.routes.js";
import authRouter from "./routes/auth.routes.js";
import servicesRouter from "./routes/services.routes.js";
import expensesRouter from "./routes/expenses.routes.js";
import reportsRouter from "./routes/reports.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requireAuth } from "./middleware/require-auth.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendDirectory = fileURLToPath(new URL("../frontend/", import.meta.url));
app.use(express.static(frontendDirectory));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
// Protected
app.use("/api/clients", requireAuth, clientsRouter);
app.use("/api/bookings", requireAuth, bookingsRouter);
app.use("/api/services", requireAuth, servicesRouter);
app.use("/api/inventory", requireAuth, inventoryRouter);
app.use("/api/income", requireAuth, incomeRouter);
app.use("/api/expenses", requireAuth, expensesRouter);
app.use("/api/reports", requireAuth, reportsRouter);

// 404 handler (za  all routes)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
