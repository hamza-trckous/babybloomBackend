const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config();

const createAdminUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
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

createAdminUsers(); // Call the function to create admin users

module.exports = createAdminUsers;
