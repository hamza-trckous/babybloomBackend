const { createClient } = require("redis");
require("dotenv").config();
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("error", (err) => console.error("Redis error:", err));

(async () => {
  await redisClient.connect();
  console.log("✅ redis Connected!");
})();

module.exports = redisClient;
