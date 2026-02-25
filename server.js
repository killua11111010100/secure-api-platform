require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const pool = require("./src/config/db");
const initDb = require("./src/config/initDb");

const authRoutes = require("./src/routes/auth.routes");
const protectedRoutes = require("./src/routes/protected.routes");
const errorHandler = require("./src/middleware/errorHandler");
const cookieParser = require("cookie-parser");

const app = express();

/* =====================
   Security & middlewares
   ===================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});

app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(cookieParser());

/* =====================
   Routes
   ===================== */
app.get("/", (req, res) => {
  res.json({ message: "Secure API Platform Running 🚀" });
});

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ status: "OK", dbTime: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: "ERROR", message: error.message });
  }
});

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);

/* =====================
   Error handler (only one)
   ===================== */
app.use(errorHandler);

/* =====================
   Start server
   ===================== */
const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });