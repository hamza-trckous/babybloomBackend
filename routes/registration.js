const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth, authorize } = require("../middleware/auth");
const { z } = require("zod");
const catchAsync = require("../utils/catchAsync");
const { ValidationError, AuthenticationError } = require("../utils/errors");

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1),
  lastname: z.string().min(1),
  dateOfbirth: z.string().optional(),
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  placeofbirth: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Cookie configuration
const getCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 3600000, // 1 hour
});

// Registration route
router.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const { name, lastname, username, email, password } =
        registerSchema.parse(req.body);

      // Check for existing user
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        throw new ValidationError("Username or email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
        name,
        lastname,
        username,
        email,
        password: hashedPassword,
        dateOfbirth: req.body.dateOfbirth,
        placeofbirth: req.body.placeofbirth,
        role: "user",
      });

      await newUser.save();

      // Generate token
      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Set cookie
      res.cookie("token", token, getCookieConfig());

      // Send response
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        user: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  })
);

// Login route
router.post(
  "/login",
  catchAsync(async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Invalid email or password");
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AuthenticationError("Invalid email or password");
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Set cookie
      res.cookie("token", token, getCookieConfig());

      // Send response
      res.status(200).json({
        status: "success",
        message: "Login successful",
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  })
);

// Protected route example
router.get(
  "/protected",
  auth,
  authorize(["admin"]),
  catchAsync(async (req, res) => {
    res.status(200).json({
      status: "success",
      message: "This is a protected route",
      user: req.user,
    });
  })
);

// Logout route
router.post(
  "/logout",
  catchAsync(async (req, res) => {
    try {
      res.clearCookie("token", {
        ...getCookieConfig(),
        maxAge: 0,
      });

      res.status(200).json({
        status: "success",
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  })
);

// Check auth status route
router.get(
  "/check-auth",
  auth,
  catchAsync(async (req, res) => {
    res.status(200).json({
      status: "success",
      isAuthenticated: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  })
);

module.exports = router;
