const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const crypto = require("crypto");

const { loginLimiter } = require("../middleware/rateLimiters");
const { hashToken } = require("../utils/tokenUtils");

const router = express.Router();

/* =====================
   Validation schemas
   ===================== */
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/* =====================
   REGISTER
   ===================== */
router.post("/register", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = value;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role",
      [email, hashedPassword]
    );

    res.status(201).json({ message: "User created", user: result.rows[0] });
  } catch (error) {
    // unique violation
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: error.message });
  }
});

/* =====================
   LOGIN (rate-limited)
   ===================== */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = value;

    const result = await pool.query(
      "SELECT id, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Access token (short)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    // Refresh token (random string)
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshHash = hashToken(refreshToken);

    const days = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshHash, expiresAt]
    );

    res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/", // <-- IMPORTANT pour tester
  maxAge: days * 24 * 60 * 60 * 1000,
});

    res.json({
      message: "Login successful",
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: test1@example.com
 *               password:
 *                 type: string
 *                 example: Test1234!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

/* =====================
   REFRESH (rotation)
   ===================== */
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "missing refresh token" });
    }

    const refreshHash = hashToken(refreshToken);

    const result = await pool.query(
      `SELECT id, user_id, revoked, expires_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [refreshHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const row = result.rows[0];

    if (row.revoked) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Get user role
    const userRes = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [row.user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userRes.rows[0];

    // Revoke old refresh token (rotation)
    await pool.query("UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1", [
      row.id,
    ]);

    // Create new refresh token
    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newRefreshHash = hashToken(newRefreshToken);

    const days = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7);
    const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, newRefreshHash, newExpiresAt]
    );

    // New access token
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

   res.cookie("refreshToken", newRefreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: days * 24 * 60 * 60 * 1000,
});

    res.json({
      accessToken: newAccessToken,
      //refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================
   LOGOUT (revoke refresh)
   ===================== */
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const refreshHash = hashToken(refreshToken);
      await pool.query(
        "UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1",
        [refreshHash]
      );
    }

    res.clearCookie("refreshToken", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;