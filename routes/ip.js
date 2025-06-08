const express = require("express");
const router = express.Router();
const requestIp = require("request-ip");

router.get("/get-ip", (req, res) => {
  let clientIp = requestIp.getClientIp(req); // Get the client's IP address

  // Handle local development IPs
  if (clientIp === "::1" || clientIp === "127.0.0.1") {
    clientIp = "0.0.0.0"; // Replace with a placeholder or skip sending this field
  }

  res.status(200).json({ ip: clientIp });
});

module.exports = router;
