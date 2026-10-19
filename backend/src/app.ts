import cors from "cors";
import express from "express";
import morgan from "morgan";
import calendarRoutes from "./routes/calendar.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import { authenticate, requireAdmin } from "./middleware/auth.js";

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(express.json());

app.use("/api/calendar", calendarRoutes);
app.use("/api/admin", authenticate, requireAdmin, adminRoutes);
app.use("/api/auth", authRoutes);

export default app;