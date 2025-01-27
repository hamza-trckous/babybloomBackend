const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { auth, authorize } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Create a new order
router.post("/", async (req, res) => {
  try {
    const { phone, address, products, totalAmount, name } = req.body; // Include name in destructuring
    const orderData = {
      phone,
      address,
      products,
      totalAmount,
      name, // Add name to orderData
    };

    // Check if user is authenticated
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        orderData.user = user._id;
      }
    }

    const order = new Order(orderData);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(error);
  }
});

// Get all orders (admin only)
router.get("/", auth, authorize(["admin"]), async (req, res) => {
  try {
    const orders = await Order.find().populate("user products.product");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update order status (admin only)
router.put("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/", auth, authorize(["admin"]), async (req, res) => {
  try {
    await Order.deleteMany();
    res.status(200).json({ message: "All orders deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
