const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth, authorize } = require("../middleware/auth");
const { z } = require("zod");
const catchAsync = require("../utils/catchAsync");
const { ValidationError, AuthenticationError } = require("../utils/errors");
const rateLimit = require("express-rate-limit");

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1, "هذا الحقل مطلوب"),
  lastname: z.string().min(1, "هذا الحقل مطلوب"),
  dateOfbirth: z.string().optional(),
  placeofbirth: z.string().optional(),
  username: z.string().min(1, "هذا الحقل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
    .regex(/\d/, "يجب أن تحتوي على رقم واحد على الأقل")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Cookie configuration
const getCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
  path: "/",
  maxAge: 3600000 // 1 hour
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
        $or: [{ username }, { email }]
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
        role: "user"
      });

      await newUser.save();

      // Generate token
      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Set cookie
      res.cookie("token", token, getCookieConfig(req));

      // Send response
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        user: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  })
);

// Login route
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  statusCode: 429,

  message: {
    status: "fail",
    message: "عدد محاولات تسجيل الدخول تم تجاوزه. حاول مرة أخرى بعد 10 دقيقة"
  },
  standardHeaders: true,
  legacyHeaders: false
});
router.post(
  "/login",
  loginLimiter,
  catchAsync(async (req, res) => {
    console.log("lgin");
    try {
      // Validate request body
      const { email, password } = loginSchema.parse(req.body);
      // Find user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        throw new AuthenticationError("Invalid email or password");
      }
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return res
          .status(403)
          .json({ message: "تم قفل الحساب مؤقتًا. حاول لاحقًا." });
      }
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
          await user.save();
          return res.status(403).json({
            message: "تم قفل   الحساب بعد عدة محاولات خاطئة. حاول بعد 10 دقائق."
          });
        }
        await user.save();
        throw new AuthenticationError("Invalid email or password");
      }
      // Generate token
      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log("creat1st Token ");

      // Set cookie
      res.cookie("token", token, getCookieConfig(req));
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      // Send response
      res.status(200).json({
        status: "success",
        message: "Login successful",
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
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
      user: req.user
    });
  })
);

// Logout route
router.post(
  "/logout",
  catchAsync(async (req, res) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/"
      });

      // Clear token from localStorage if you're using it as fallback
      res.status(200).json({
        status: "success",
        message: "Logout successful"
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        status: "error",
        message: "Logout failed"
      });
    }
  })
);

router.post("/testHack", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password
  });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ message: "Login success", user });
});

module.exports = router;
