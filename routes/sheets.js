const { google } = require("googleapis");
const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
dotenv.config(); // تحميل متغيرات البيئة

const sheets = google.sheets({
  version: "v4",
  auth: process.env.GOOGLE_API_KEY,
});

// Update data in Google Sheets
router.post("/sheets/update", async (req, res) => {
  try {
    const { values } = req.body;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = process.env.RANGE;

    const resource = {
      values,
    };

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource,
      key: process.env.GOOGLE_API_KEY,
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
