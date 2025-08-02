const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const hpp = require("hpp");

const errorHandler = require("./middleware/errorHandler");
const { AppError } = require("./utils/errors");
// Import routes
const authRoutes = require("./routes/auth");
const registrationRoutes = require("./routes/registration");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const shippingRoutes = require("./routes/shipping");
const conversionRoutes = require("./routes/conversion");
const settingsRoutes = require("./routes/settings");
const ipRoute = require("./routes/ip");
const policiesRoutes = require("./routes/policys");
const sheetsRoutes = require("./routes/sheets");
const healthRoutes = require("./routes/health");
const profile = require("./routes/profile");
const categoriesRoutes = require("./routes/categorys");
const setLanguageAndColor = require("./middleware/languageANdColorThemDetect");
const { getTranslation } = require("./routes/langController");
dotenv.config();

// Environment variables and constants
const isProduction = process.env.NODE_ENV === "production";
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 5000;
const app = express();

// Cookie configuration
// const cookieConfig = {
//   httpOnly: true,
//   secure: isProduction,
//   sameSite: isProduction ? "none" : "lax",
//   maxAge: 24 * 60 * 60 * 1000,
//   path: "/"
// };

// CORS Configuration
const allowedOrigins = [
  "http://localhost",
  "http://192.168.1.7:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://babybloom-dz.vercel.app",
  "https://vs-ebon.vercel.app",
  "https://vs-d9fwvjznu-hamza-trickings-projects.vercel.app",
  "https://vs-6l3or02ih-hamza-trickings-projects.vercel.app",
  "https://vs-qtg3hdzku-hamza-trickings-projects.vercel.app"
];

// CORS middleware with debugging
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "X-CSRF-Token",
      "x-csrf-token",
      "X-XSRF-TOKEN",
      "XSRF-TOKEN"
    ]
  })
);

// Security middleware
app.use(hpp());

app.use(helmet());
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});
// Custom CSP configuration
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "*.facebook.com",
        "*.fbcdn.net",
        "*.facebook.net",
        "connect.facebook.net",
        "https://*.google-analytics.com",
        "*.google.com",
        "https://gw.conversionsapigateway.com",
        "blob:",
        "data:"
      ],
      connectSrc: [
        "'self'",
        "*.facebook.com",
        "*.google-analytics.com",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        " https://babybloombackend.onrender.com"
      ],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:", "*.gstatic.com"], // Allow fonts from data URIs and gstatic.com
      frameSrc: ["'self'", "*.facebook.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  })
);

// Parse requests
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  next();
});

// Routes
app.get("/api/translate", getTranslation);

app.use(setLanguageAndColor);
app.use("/api", registrationRoutes);
app.use("/api", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api", conversionRoutes);
app.use("/api", settingsRoutes);
app.use("/api", ipRoute);
app.use("/api", policiesRoutes);
app.use("/api", sheetsRoutes);
app.use("/api", healthRoutes);
app.use("/api", profile);
app.use("/api/category", categoriesRoutes);

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Environment variable check
if (!process.env.JWT_SECRET) {
  throw new AppError("JWT_SECRET environment variable is not set", 500);
}

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    console.log("🟡 Attempting MongoDB connection...");
    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB Connected!");
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);

    if (retries === 0) {
      console.error("❌ All retry attempts failed. Exiting.");
      process.exit(1);
    }

    console.log(`🔁 Retrying in 5s... (${retries} retries left)`);
    setTimeout(() => connectDB(retries - 1), 5000);
  }
};

connectDB();

// Basic route
app.get(
  "/",
  catchAsync(async (req, res) => {
    res.send("Server is running");
  })
);

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", {
    name: err.name,
    message: err.message,
    stack: isProduction ? undefined : err.stack
  });

  if (err.message.includes("not allowed by CORS")) {
    return res.status(403).json({
      status: "error",
      message: "CORS error: Origin not allowed"
    });
  }

  errorHandler(err, req, res, next);
});

// Start server
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
