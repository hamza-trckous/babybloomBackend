const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config();

const createAdminUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminUsers = [
      {
        username: "admin1",
        email: "admin1@example.com",
        password: "admin123",
        role: "admin",
      },
      {
        username: "admin2",
        email: "admin2@example.com",
        password: "admin123",
        role: "admin",
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
        console.log(`Admin user ${admin.username} created`);
      } else {
        console.log(`Admin user ${admin.username} already exists`);
      }
    }
  } catch (error) {
    console.error("Error creating admin users:", error);
  }
};

module.exports = createAdminUsers;
