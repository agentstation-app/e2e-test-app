import { Router } from "express";
import { query } from "../db/connection";
import { AuthRequest, requireRole } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";

export const usersRouter = Router();

usersRouter.get("/me", async (req: AuthRequest, res) => {
  const result = await query(
    "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
    [req.userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  res.json(result.rows[0]);
});

usersRouter.get("/", requireRole("admin"), async (_req, res) => {
  const result = await query(
    "SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

usersRouter.delete("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  if (Number(req.params.id) === req.userId) {
    throw new AppError(400, "Cannot delete your own account");
  }

  const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  res.json({ deleted: true });
});