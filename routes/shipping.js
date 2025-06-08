const express = require("express");
const router = express.Router();
const Shipping = require("../models/shipp");

// Get all shipping prices
router.get("/", async (req, res) => {
  try {
    const shippingPrices = await Shipping.find();
    res.status(200).json(shippingPrices);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create initial list of shipping prices
router.post("/create", async (req, res) => {
  try {
    const shippingPrices = req.body.shippingPrices.map((item) => ({
      wilayas: item.wilaya,
      priceToDesktop: item.priceToDesktop,
      priceToHomme: item.priceToHomme
    }));
    await Shipping.insertMany(shippingPrices);
    res
      .status(201)
      .json({ message: "Initial shipping prices created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update shipping price for a specific wilaya
router.post("/update", async (req, res) => {
  try {
    const { wilaya, priceToDesktop, priceToHomme } = req.body;
    let shipping = await Shipping.findOne({ wilayas: wilaya });
    if (!shipping) {
      shipping = new Shipping({
        wilayas: wilaya,
        priceToDesktop,
        priceToHomme
      });
    } else {
      shipping.priceToDesktop = priceToDesktop;
      shipping.priceToHomme = priceToHomme;
    }
    await shipping.save();
    res.status(200).json({ message: "Shipping price updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete shipping price for a specific wilaya
router.delete("/delete", async (req, res) => {
  try {
    const { wilaya } = req.body;
    const shipping = await Shipping.findOneAndDelete({ wilayas: wilaya });
    if (shipping) {
      res.status(200).json({ message: "Shipping price deleted successfully" });
    } else {
      res.status(400).json({ error: "Wilaya not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
