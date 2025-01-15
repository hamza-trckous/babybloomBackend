const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  pixelId: { type: String, required: true },
  accessToken: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Setting", settingSchema);
