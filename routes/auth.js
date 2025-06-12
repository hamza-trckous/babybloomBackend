const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const catchAsync = require("../utils/catchAsync");
const { AuthenticationError } = require("../utils/errors");

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Cookie configuration
const getCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 3600000 // 1 hour
});

router.get(
  "/check-auth",
  catchAsync(async (req, res) => {
    try {
      // Check both cookie and Authorization header for token
      const token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res.status(401).json({
          status: "fail",
          isAuthenticated: false,
          message: "No token provided"
        });
      }

      // Decode token first (does NOT throw on expired)
      const decoded = jwt.decode(token);

      if (!decoded || !decoded.exp || !decoded.id) {
        throw new Error("Invalid token structure");
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        throw new jwt.TokenExpiredError(
          "jwt expired",
          new Date(decoded.exp * 1000)
        );
      }

      // Check if near expiration (refresh condition)
      const timeLeft = decoded.exp - now;
      if (timeLeft < 600) {
        const user = await User.findById(decoded.id).select("-password").lean();
        if (!user) throw new Error("User not found");

        const newToken = jwt.sign(
          {
            id: user._id,
            role: user.role,
            email: user.email
          },
          process.env.JWT_SECRET,
          { expiresIn: "5m" }
        );

        res.cookie("token", newToken, getCookieConfig(req));

        return res.status(200).json({
          status: "success",
          isAuthenticated: true,
          user: {
            name: user.name,
            email: user.email,
            role: user.role
          },
          token: newToken
        });
      }

      // If not near expiration, now verify
      jwt.verify(token, process.env.JWT_SECRET);

      // Then respond
      const user = await User.findById(decoded.id).select("-password").lean();
      if (!user) throw new Error("User not found");

      return res.status(200).json({
        status: "success",
        isAuthenticated: true,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Auth check error:", error);

      // Clear invalid token with proper configuration
      const { maxAge, ...cookieConfig } = getCookieConfig(req);
      res.clearCookie("token", cookieConfig);
      return res.status(401).json({
        status: "fail",
        isAuthenticated: false,
        message: "Invalid or expired token"
      });
    }
  })
);

// Test cookie route (for debugging)
router.get(
  "/test-cookie",
  catchAsync(async (req, res) => {
    try {
      res.cookie("test-cookie", "test-value", getCookieConfig());
      res.json({
        status: "success",
        message: "Test cookie set",
        cookieConfig: getCookieConfig()
      });
    } catch (error) {
      console.error("Test cookie error:", error);
      throw error;
    }
  })
);

module.exports = router;
