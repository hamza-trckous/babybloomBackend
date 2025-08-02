const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.json({ limit: "100mb" }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("HelpServices Work");
});
app.post("/help", (req, res) => {
  console.log(req);
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ msg: "there is no correct information" });
  }
  console.log(`support tickt from user ${userId} : ${message}`);
  return res.status(200).json({ msg: "send message succesfully " });
});
const PORT = process.env.PORT2 || 5001;

app.listen(PORT, () => {
  console.log(`Server Help Service Run on Port ${PORT}`);
});
