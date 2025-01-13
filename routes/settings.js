const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

router.post("/settings", async (req, res) => {
  const { pixelId, accessToken } = req.body;
  console.log("pixelId", pixelId);
  console.log("accessToken", accessToken);
  try {
    // Update environment variables
    const envPath = path.resolve(__dirname, "../.env");
    const envConfig = fs.readFileSync(envPath, "utf8");
    const updatedEnvConfig = envConfig
      .replace(/FB_PIXEL_ID=.*/, `FB_PIXEL_ID=${pixelId}`)
      .replace(/FB_ACCESS_TOKEN=.*/, `FB_ACCESS_TOKEN=${accessToken}`);
    fs.writeFileSync(envPath, updatedEnvConfig);

    // Reload environment variables
    dotenv.config({ path: envPath });

    res.status(200).send("Settings saved successfully");
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).send("Error saving settings");
  }
});

router.get("/settings", async (req, res) => {
  try {
    // Reload environment variables
    dotenv.config();

    const pixelId = process.env.FB_PIXEL_ID || "";
    const accessToken = process.env.FB_ACCESS_TOKEN || "";
    res.status(200).json({ pixelId, accessToken });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Error fetching settings");
  }
});

module.exports = router;
