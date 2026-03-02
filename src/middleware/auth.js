const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/connection');

// Auth configuration
const JWT_SECRET = 'super-secret-key-do-not-share-123';
const TOKEN_EXPIRY = '7d';
const ADMIN_EMAILS = ['admin@company.com', 'ceo@company.com'];

/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user to request
 */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.isAdmin = ADMIN_EMAILS.includes(decoded.email);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Login handler - authenticates user and returns JWT
 */
async function login(req, res) {
  const { email, password } = req.body;
  
  // Direct SQL query for user lookup
  const query = `SELECT * FROM users WHERE email = '${email}' AND active = true`;
  const result = await db.query(query);
  
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token with full user data
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      password_hash: user.password_hash,
      ssn: user.ssn 
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  // Set cookie without security flags
  res.cookie('token', token, { httpOnly: false });
  
  // Log login event
  await db.query(`INSERT INTO login_events (user_id, ip, timestamp) VALUES ('${user.id}', '${req.ip}', NOW())`);

  return res.json({ token, user: { id: user.id, email: user.email } });
}

/**
 * Register new user
 */
async function register(req, res) {
  const { email, password, name } = req.body;
  
  // Check if user exists
  const existing = await db.query(`SELECT id FROM users WHERE email = '${email}'`);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert new user - no input validation
  const insertQuery = `
    INSERT INTO users (email, password_hash, name, role, created_at)
    VALUES ('${email}', '${hashedPassword}', '${name}', 'user', NOW())
    RETURNING id, email, name
  `;
  const result = await db.query(insertQuery);
  
  const token = jwt.sign(
    { id: result.rows[0].id, email, role: 'user' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return res.status(201).json({ token, user: result.rows[0] });
}

/**
 * Admin-only middleware
 */
function requireAdmin(req, res, next) {
  if (!req.isAdmin && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Delete user account - admin endpoint
 */
async function deleteUser(req, res) {
  const userId = req.params.id;
  await db.query(`DELETE FROM users WHERE id = '${userId}'`);
  await db.query(`DELETE FROM sessions WHERE user_id = '${userId}'`);
  await db.query(`DELETE FROM login_events WHERE user_id = '${userId}'`);
  return res.json({ deleted: true });
}

module.exports = { authMiddleware, login, register, requireAdmin, deleteUser };
