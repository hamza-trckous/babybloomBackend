const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (String(req.originalUrl).trim().includes("support")) {
    console.log(req.originalUrl, "this is ");
  }

  next();
});
app.use(
  "/store",
  createProxyMiddleware({
    target: "http://backend:5000",
    changeOrigin: true,
    pathRewrite: { "^/store": "" }
  })
);

app.use(
  "/support",
  createProxyMiddleware({
    target: "http://backend:5001",
    changeOrigin: true,
    pathRewrite: {
      "^/support": ""
    }
  })
);
const PORT = 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gateway is running on http://localhost:${PORT}`);
});
