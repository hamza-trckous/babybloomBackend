const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") }); // Load environment variables

console.log("Environment Variables:", process.env); // Log all environment variables to verify

const MONGO_URI = process.env.MONGO_URI;

console.log("MONGO_URI:", MONGO_URI); // Log the MONGO_URI to verify it's loaded correctly

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in the environment variables");
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    createAdminUsers(); // Call the function to create admin users
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const createAdminUsers = async () => {
  try {
    console.log("Connected to MongoDB 2");

    const adminUsers = [
      {
        username: "admin1",
        email: "admin1@example.com",
        password: "admin123",
        role: "admin",
        name: "Admin",
        lastname: "One",
      },
      {
        username: "admin2",
        email: "admin2@example.com",
        password: "admin123",
        role: "admin",
        name: "Admin",
        lastname: "Two",
      },
    ];

    for (const admin of adminUsers) {
      const existingUser = await User.findOne({ email: admin.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await User.create({
          ...admin,
          password: hashedPassword,
        });
        console.log(
          `Admin user ${admin.username} created with hashed password: ${hashedPassword}`
        );
      } else {
        console.log(`Admin user ${admin.username} already exists`);
      }
    }

    const allUsers = await User.find({ role: "admin" });
    console.log("All admin users in the database:", allUsers);

    mongoose.connection.close(); // Close the connection after creating users
    console.log("Connection to MongoDB closed");
  } catch (error) {
    console.error("Error creating admin users:", error);
  }
};

module.exports = createAdminUsers;
