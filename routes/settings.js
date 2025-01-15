const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting"); // Import the Setting model

router.post("/settings", async (req, res) => {
  const { pixelId, accessToken } = req.body;
  console.log("pixelId", pixelId);
  console.log("accessToken", accessToken);
  try {
    // Update settings in MongoDB
    const settings = await Setting.findOneAndUpdate(
      {},
      { pixelId, accessToken, lastUpdated: Date.now() },
      { upsert: true, new: true }
    );

    res.status(200).send("Settings saved successfully");
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).send("Error saving settings");
  }
});

router.get("/settings", async (req, res) => {
  try {
    const settings = await Setting.findOne({});
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
