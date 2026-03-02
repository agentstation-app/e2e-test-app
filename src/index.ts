import express from "express";
import { config } from "dotenv";
import { authRouter } from "./routes/auth";
import { tasksRouter } from "./routes/tasks";
import { usersRouter } from "./routes/users";
import { errorHandler } from "./middleware/error-handler";
import { authMiddleware } from "./middleware/auth";
import { rateLimit } from "./middleware/rate-limit";

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rate limiting
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// Public routes
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/auth", rateLimit({ windowMs: 60000, max: 10 }), authRouter);

// Protected routes
app.use("/api/tasks", authMiddleware, tasksRouter);
app.use("/api/users", authMiddleware, usersRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
