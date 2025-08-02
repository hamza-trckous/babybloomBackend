const mongoose = require("mongoose");
const AccountSchema = new mongoose.Schema({
  name: { type: String, required: false, default: "DefaultEmail@email.com" },
  enable: { type: Boolean, required: false, default: true }
});
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
    enable: { type: Boolean, required: false, default: true },
    title: { type: String, required: false },
    subtitle: { type: String, required: false }
  },
  color: {
    type: String,
    enum: ["teal", "blue", "red", "green", "yellow", "purple", "pink", "gray"],
    default: "teal"
  },
  slogon: {
    name: { type: String, required: true },
    enable: { type: Boolean, required: false, default: true }
  },
  category: {
    enable: { type: Boolean, required: false, default: true }
  },
  email: {
    type: AccountSchema
  },
  accounts: {
    type: [AccountSchema]
  },

  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", settingSchema);
