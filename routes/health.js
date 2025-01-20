const express = require("express");
const router = express.Router();
router.get("/health", (req, res) => {
  res.status(200).send("OK"); // Simple response to indicate the server is running
});

module.exports = router;
