const { google } = require("googleapis");
const express = require("express");
const fs = require("fs");
const dotenv = require("dotenv");
const router = express.Router();
dotenv.config(); // تحميل متغيرات البيئة

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
const sheets = google.sheets({
  version: "v4",
  auth: oauth2Client,
});

// Route to initiate OAuth2 flow
router.get("/auth", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  res.redirect(authUrl);
});

// OAuth2 callback route
router.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Access token:", tokens);
    oauth2Client.setCredentials(tokens);
    // Save the refresh token to .env
    if (tokens.refresh_token) {
      const envFilePath = ".env";
      let envFileContent = fs.existsSync(envFilePath)
        ? fs.readFileSync(envFilePath, "utf8")
        : "";
      envFileContent += `\nREFRESH_TOKEN=${tokens.refresh_token}\n`;
      fs.writeFileSync(envFilePath, envFileContent);
      dotenv.config(); // Reload environment variables
    }
    res.send("Authentication successful! You can close this window.");
  } catch (error) {
    console.error("Error retrieving access token:", error);
    res.status(500).send("Error retrieving access token");
  }
});

// Update data in Google Sheets
router.post("/sheets/update", async (req, res) => {
  try {
    let { values, range, spreadsheetId } = req.body;

    if (!spreadsheetId) {
      spreadsheetId = process.env.SPREADSHEET_ID;
      if (!spreadsheetId) {
        return res.status(400).json({
          message: "Missing required parameter: spreadsheetId",
        });
      }
    }
    if (!range) {
      const numRows = values.length;
      const numCols = values[0].length;
      const startCell = "A1";
      const endCell = String.fromCharCode(65 + numCols - 1) + numRows;
      range = `Sheet1!${startCell}:${endCell}`;
    }
    const resource = {
      values,
    };
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource,
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Error updating data in Google Sheets:", error);
  }
});

// Get current values from environment variables
router.get("/sheets/config", (req, res) => {
  try {
    const config = {
      spreadsheetId: process.env.SPREADSHEET_ID,
      CLIENT_ID: process.env.CLIENT_ID,
      CLIENT_SECRET: process.env.CLIENT_SECRET,
      REDIRECT_URI: process.env.REDIRECT_URI,
      REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Error getting config values:", error);
  }
});

// Update environment variables
router.post("/sheets/config", (req, res) => {
  try {
    const { spreadsheetId, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({
        message: "Missing required parameters: spreadsheetId",
      });
    }
    const envFilePath = ".env";
    let envFileContent = fs.existsSync(envFilePath)
      ? fs.readFileSync(envFilePath, "utf8")
      : "";

    const envConfig = {
      SPREADSHEET_ID: spreadsheetId || process.env.SPREADSHEET_ID,
      CLIENT_ID: CLIENT_ID || process.env.CLIENT_ID,
      CLIENT_SECRET: CLIENT_SECRET || process.env.CLIENT_SECRET,
      REDIRECT_URI: REDIRECT_URI || process.env.REDIRECT_URI,
    };

    const newEnvFileContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // دمج القيم الجديدة مع القيم القديمة
    const updatedEnvFileContent = envFileContent
      .split("\n")
      .filter(
        (line) =>
          !line.startsWith("SPREADSHEET_ID=") &&
          !line.startsWith("CLIENT_ID=") &&
          !line.startsWith("CLIENT_SECRET=") &&
          !line.startsWith("REDIRECT_URI=")
      )
      .concat(newEnvFileContent)
      .join("\n");

    // كتابة المحتوى الجديد إلى ملف .env
    fs.writeFileSync(envFilePath, updatedEnvFileContent);
    dotenv.config(); // Reload environment variables

    res.json({ message: "Config updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Error updating config values:", error);
  }
});

module.exports = router;
