const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../middleware/auth");

// Add product to cart
router.post("/add-to-cart", auth, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const cartItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();
    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Remove product from cart
router.post("/remove-from-cart", auth, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    user.cart = user.cart.filter(
      (item) => item.productId.toString() !== productId
    );

    await user.save();
    res
      .status(200)
      .json({ message: "Product removed from cart", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get cart items
router.get("/cart", auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate("cart.productId");
    res.status(200).json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
