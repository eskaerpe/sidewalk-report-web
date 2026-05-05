import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { adminAuth } from "./middleware/adminAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
	}),
);
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

app.use("/api/reports", reportRoutes);
app.use("/api/admin/login", authRoutes);
app.use("/api/admin", adminAuth, adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
