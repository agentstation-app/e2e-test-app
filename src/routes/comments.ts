import { Router } from "express";
import { z } from "zod";
import { query } from "../db/connection";
import { validate } from "../middleware/validate";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";

export const commentsRouter = Router({ mergeParams: true });

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// GET /api/tasks/:taskId/comments
commentsRouter.get("/", async (req: AuthRequest, res) => {
  const { taskId } = req.params;

  // Verify task exists
  const taskResult = await query("SELECT id FROM tasks WHERE id = $1", [taskId]);
  if (taskResult.rows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  const result = await query(
    `SELECT c.*, u.name as author_name, u.email as author_email
     FROM task_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
    [taskId]
  );

  res.json({ comments: result.rows });
});

// POST /api/tasks/:taskId/comments
commentsRouter.post("/", validate(createCommentSchema), async (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  // Verify task exists
  const taskResult = await query("SELECT id FROM tasks WHERE id = $1", [taskId]);
  if (taskResult.rows.length === 0) {
    throw new AppError(404, "Task not found");
  }

  const result = await query(
    `INSERT INTO task_comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [taskId, req.userId, content]
  );

  res.status(201).json(result.rows[0]);
});

// DELETE /api/tasks/:taskId/comments/:commentId
commentsRouter.delete("/:commentId", async (req: AuthRequest, res) => {
  const { commentId } = req.params;

  // Only allow deleting own comments (or admin)
  const comment = await query("SELECT * FROM task_comments WHERE id = $1", [commentId]);
  if (comment.rows.length === 0) {
    throw new AppError(404, "Comment not found");
  }

  if (comment.rows[0].user_id \!== req.userId && req.userRole \!== "admin") {
    throw new AppError(403, "You can only delete your own comments");
  }

  await query("DELETE FROM task_comments WHERE id = $1", [commentId]);
  res.json({ deleted: true });
});