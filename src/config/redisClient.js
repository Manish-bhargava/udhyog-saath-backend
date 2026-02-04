const Redis = require("ioredis");

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

redis.on("connect", () => console.log("✅ Redis Stack is ready"));
redis.on("error", (err) => console.error("❌ Redis Error:", err));

// Change this to module.exports
module.exports = redis;