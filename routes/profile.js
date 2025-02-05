const express = require("express");
const router = express.Router();
const profile = require("../models/profile");

router.post("/profile", async (req, res) => {
  const { logo, nameOfBrand, cover } = req.body;
  console.log("nameOfBrand", nameOfBrand);
  console.log("logo", logo);
  try {
    // Update settings in MongoDB
    const settings = await profile.findOneAndUpdate(
      {},
      { logo, cover, nameOfBrand, lastUpdated: Date.now() },
      { upsert: true, new: true }
    );

    res.status(200).send("Settings saved successfully");
  } catch (error) {
    console.error("Error saving settings:", error);
    console.log(error);
    res.status(500).send("Error saving settings");
  }
});

router.get("/profile", async (req, res) => {
  try {
    const settings = await profile.findOne({});
    console.log("settings found", settings);
    if (!settings) {
      return res.status(404).send("Settings not found");
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Error fetching settings");
  }
});

module.exports = router;
