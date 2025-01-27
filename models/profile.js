const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  logo: { type: String, required: true },
  nameOfBrand: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Profile", settingSchema);
