const express = require("express");
const router = express.Router();
const profile = require("../models/profile");
const redisClient = require("../redis/client");

router.post("/profile", async (req, res) => {
  const { logo, nameOfBrand, cover, color, slogon, category, email, accounts } =
    req.body;

  try {
    const settings = await profile.findOneAndUpdate(
      {},
      {
        logo,
        nameOfBrand,
        cover,
        color,
        slogon,
        category,
        email,
        accounts,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );
    console.log(settings);
    res.status(200).send("Settings saved successfully");
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).send("Error saving settings");
  }
});

router.get("/profile", async (req, res) => {
  try {
    const cachedProfilekey = "profile:all";
    const cachedData = await redisClient.get(cachedProfilekey);
    if (cachedData) {
      console.log(" with caching profile ");

      return res.status(200).json(JSON.parse(cachedData));
    }

    const settings = await profile.findOne({});
    if (!settings) {
      return res.status(200).json(null);
    }
    res.status(200).json(settings);
    await redisClient.setEx(cachedProfilekey, 600, JSON.stringify(settings));
    console.log("1st without caching profile ");
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Error fetching settings");
  }
});

module.exports = router;
