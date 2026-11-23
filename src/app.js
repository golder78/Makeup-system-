import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bookingsRouter from "./routes/bookings.routes.js";
import clientsRouter from "./routes/clients.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";
import incomeRouter from "./routes/income.routes.js";
import expensesRouter from "./routes/expenses.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/bookings", bookingsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expenses", expensesRouter);

// 404 handler (za  all routes)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
