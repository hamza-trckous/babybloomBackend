const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Cookies = require("cookies"); // Import the cookies library
const { auth, authorize } = require("../middleware/auth");
const { z } = require("zod");
const catchAsync = require("../utils/catchAsync");
const { ValidationError, AuthenticationError } = require("../utils/errors");

// ...existing code...

const registerSchema = z.object({
  name: z.string().min(1),
  lastname: z.string().min(1),
  dateOfbirth: z.date().optional(),
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]),
  placeofbirth: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/register",
  catchAsync(async (req, res) => {
    const { username, email, password, role } = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new ValidationError("Username or email already exists");
    }

    if (role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount >= 2) {
        throw new ValidationError("Cannot register more than 2 admins");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const cookies = new Cookies(req, res); // Initialize cookies
    cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from "strict" to "lax"
      path: "/",
      maxAge: 3600000, // 1 hour
      // Add 'domain' if necessary
    });

    res.status(201).json({ message: "User registered successfully", newUser });
  })
);

router.post(
  "/login",
  catchAsync(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AuthenticationError("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const cookies = new Cookies(req, res); // Initialize cookies
    cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from "strict" to "lax"
      path: "/",
      maxAge: 3600000, // 1 hour
      // Add 'domain' if necessary
    });

    res.status(200).json({ message: "Login successful" }); // Removed 'user' from response
  })
);

// Example of a protected route
router.get("/protected", auth, authorize(["admin"]), (req, res) => {
  res
    .status(200)
    .json({ message: "This is a protected route", user: req.user });
});

// Logout endpoint
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(200).json({ message: "Logout successful" });
});

module.exports = router;
