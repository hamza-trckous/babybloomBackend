const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth"); // Import the authorize middleware

// Get all users
router.get("/", auth, authorize(["admin"]), async (req, res) => {
  try {
    const users = await User.find().populate("cart.productId");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a user
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("cart.productId");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
