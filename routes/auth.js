const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to handle login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Replace this with your actual user authentication logic
  if (email === "user@example.com" && password === "password") {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.status(200).json({ token });
  } else {
    return res.status(401).json({ error: "Invalid email or password" });
  }
});

// Middleware to check authentication
router.get("/check-auth", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res
        .status(500)
        .json({ isAuthenticated: false, error: "Internal Server Error" });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ isAuthenticated: false });
      }
      return res.status(200).json({ isAuthenticated: true, role: user.role });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res
        .status(500)
        .json({ isAuthenticated: false, error: "Internal Server Error" });
    }
  });
});

module.exports = router;
