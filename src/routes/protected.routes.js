const express = require("express");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// accessible à tout utilisateur connecté
router.get("/me", auth, (req, res) => {
  res.json({ message: "You are authenticated ✅", user: req.user });
});

// accessible seulement aux admins
router.get("/admin", auth, requireRole("admin"), (req, res) => {
  res.json({ message: "Welcome admin 👑", user: req.user });
});

module.exports = router;