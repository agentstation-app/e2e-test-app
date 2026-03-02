import { Router } from "express";
import { z } from "zod";
import { query } from "../db/connection";
import { validate } from "../middleware/validate";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";

export const tasksRouter = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignedTo: z.number().optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.number().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

tasksRouter.get("/", async (req: AuthRequest, res) => {
  const { status, priority, assignedTo, page = "1", limit = "20" } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = "WHERE 1=1";
  const params: unknown[] = [];

  if (status) {
    params.push(status);
    whereClause += ` AND t.status = $${params.length}`;
  }
  if (priority) {
    params.push(priority);
    whereClause += ` AND t.priority = $${params.length}`;
  }
  if (assignedTo) {
    params.push(Number(assignedTo));
    whereClause += ` AND t.assigned_to = $${params.length}`;
  }

  params.push(Number(limit), offset);

  const result = await query(
    `SELECT t.*, u.name as assigned_to_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({ tasks: result.rows, page: Number(page), limit: Number(limit) });
});

tasksRouter.get("/:id", async (req: AuthRequest, res) => {
  const result = await query(
    `SELECT t.*, u.name as assigned_to_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  res.json(result.rows[0]);
});

tasksRouter.post("/", validate(createTaskSchema), async (req: AuthRequest, res) => {
  const { title, description, priority, assignedTo, dueDate } = req.body;

  const result = await query(
    `INSERT INTO tasks (title, description, priority, assigned_to, created_by, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description || null, priority, assignedTo || null, req.userId, dueDate || null]
  );

  res.status(201).json(result.rows[0]);
});

tasksRouter.put("/:id", validate(updateTaskSchema), async (req: AuthRequest, res) => {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(req.body)) {
    const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    updates.push(`${dbKey} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }

  updates.push(`updated_at = NOW()`);
  params.push(req.params.id);

  const result = await query(
    `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  res.json(result.rows[0]);
});

tasksRouter.delete("/:id", async (req: AuthRequest, res) => {
  const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  res.json({ deleted: true });
});