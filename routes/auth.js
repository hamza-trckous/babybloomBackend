const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Cookies = require("cookies");
const { z } = require("zod");
const catchAsync = require("../utils/catchAsync");
const { AuthenticationError } = require("../utils/errors");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/login",
  catchAsync(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    console.log("Login attempt with email:", email); // Add logging

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email); // Add logging
      throw new AuthenticationError("Invalid email or password");
    }

    console.log("User found:", user); // Add logging

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for user:", user.username); // Add logging
      throw new AuthenticationError("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const cookies = new Cookies(req, res);
    cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Login successful" });
  })
);

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
