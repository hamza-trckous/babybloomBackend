const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const helmet = require("helmet"); // Import helmet for security headers
const errorHandler = require("./middleware/errorHandler");
const { AppError } = require("./utils/errors");
const authRoutes = require("./routes/auth");
const registrationRoutes = require("./routes/registration");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const shippingRoutes = require("./routes/shipping");
const conversionRoutes = require("./routes/conversion");
const settingsRoutes = require("./routes/settings"); // Import settings routes
const ipRoute = require("./routes/ip"); // Import the IP route
const policiesRoutes = require("./routes/policys"); // Import policies routes
const sheetsRoutes = require("./routes/sheets"); // Import sheets routes

dotenv.config();
const mongoURI = process.env.MONGO_URI;
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Apply Helmet middleware for security headers
app.use(helmet());

// Set custom Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "*.facebook.com",
        "*.fbcdn.net",
        "*.facebook.net",
        "127.0.0.1:*",
        "'unsafe-inline'",
        "blob:",
        "data:",
        "connect.facebook.net",
        "'wasm-unsafe-eval'",
        "https://*.google-analytics.com",
        "*.google.com",
        "https://gw.conversionsapigateway.com", // Added this line
      ],
      // ...other directives...
    },
  })
);

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());
app.use(cookieParser());

// Handle preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

// Routes
app.use("/api", registrationRoutes);
app.use("/api", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes); // Use users routes
app.use("/api/orders", ordersRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api", conversionRoutes);
app.use("/api", settingsRoutes); // Use settings routes
app.use("/api", ipRoute); // Use the IP route
app.use("/api", policiesRoutes); // Use policies routes
app.use("/api", sheetsRoutes); // Use sheets routes

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Ensure that the JWT_SECRET environment variable is set
if (!process.env.JWT_SECRET) {
  throw new AppError("JWT_SECRET environment variable is not set", 500);
}

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1); // Exit the process if the database connection fails
  });

// Basic route with error handling
app.get(
  "/",
  catchAsync(async (req, res) => {
    res.send("Hello, world!");
  })
);

// Handle undefined Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle unhandled rejections
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
