import { Router } from "express";
import { getPool } from "../db/connection";

export const healthRouter = Router();

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: string; latencyMs?: number; error?: string };
    memory: { status: string; usedMb: number; totalMb: number; percentage: number };
  };
}

healthRouter.get("/", async (_req, res) => {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: "unknown" },
      memory: { status: "unknown", usedMb: 0, totalMb: 0, percentage: 0 },
    },
  };

  // Check database connectivity
  try {
    const start = Date.now();
    const pool = getPool();
    await pool.query("SELECT 1");
    const latency = Date.now() - start;
    health.checks.database = {
      status: latency < 1000 ? "healthy" : "degraded",
      latencyMs: latency,
    };
    if (latency >= 1000) health.status = "degraded";
  } catch (err) {
    health.checks.database = {
      status: "unhealthy",
      error: err instanceof Error ? err.message : "Unknown error",
    };
    health.status = "unhealthy";
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const usedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
  const totalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
  const percentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  health.checks.memory = {
    status: percentage < 90 ? "healthy" : "degraded",
    usedMb,
    totalMb,
    percentage,
  };
  if (percentage >= 90) health.status = "degraded";

  const statusCode = health.status === "unhealthy" ? 503 : 200;
  res.status(statusCode).json(health);
});

healthRouter.get("/ready", async (_req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

healthRouter.get("/live", (_req, res) => {
  res.json({ alive: true });
});