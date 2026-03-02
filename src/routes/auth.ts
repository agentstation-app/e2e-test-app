import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db/connection";
import { validate } from "../middleware/validate";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role",
      [email, passwordHash, name]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET\!,
      { expiresIn: "7d" }
    );

    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    throw err;
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (\!user || \!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET\!,
    { expiresIn: "7d" }
  );

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});