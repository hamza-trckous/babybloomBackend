const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  logo: {
    src: { type: String, required: true },
    enable: { type: Boolean, required: false, default: true }
  },
  nameOfBrand: {
    name: { type: String, required: true },
    enable: { type: Boolean, required: false, default: true }
  },
  cover: {
    name: { type: String, required: true },
    enable: { type: Boolean, required: false, default: true }
  },
  color: {
    type: String,
    enum: ["teal", "blue", "red", "green", "yellow", "purple", "pink", "gray"],
    default: "teal"
  },

  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", settingSchema);
