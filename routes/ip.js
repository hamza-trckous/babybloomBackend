const express = require("express");
const router = express.Router();

router.get("/get-ip", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("IP Address:", ip);
  res.status(200).json({ ip });
});

module.exports = router;
