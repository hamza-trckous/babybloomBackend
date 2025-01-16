const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const router = express.Router();

const hashEmail = (email) => {
  return crypto.createHash("sha256").update(email).digest("hex");
};

router.post("/track-conversion", async (req, res) => {
  const { event_name, event_time, user_data, custom_data } = req.body;
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const pixelId = process.env.FB_PIXEL_ID; // Use the stored Pixel ID
  const apiVersion = "v21.0"; // Use the appropriate API version

  if (!accessToken || !pixelId) {
    return res.status(500).send("Facebook access token or Pixel ID is not set");
  }

  try {
    const hashedUserData = {
      ...user_data,
      em: user_data.em ? hashEmail(user_data.em) : undefined,
    };

    const eventData = {
      data: [
        {
          event_name,
          event_time,
          user_data: hashedUserData,
          custom_data,
        },
      ],
    };

    console.log(
      "Sending event data to Facebook:",
      JSON.stringify(eventData, null, 2)
    );

    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`,
      eventData
    );
    console.log(eventData);

    res.status(200).send(response.data);
  } catch (error) {
    console.error(
      "Error sending conversion event:",
      error.response?.data || error.message
    );
    res.status(500).send({
      message: "Error sending conversion event",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
