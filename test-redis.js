const IORedis = require('ioredis');
require('dotenv').config();

console.log("Connecting to Redis...");
const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {},
});

redis.on('connect', () => console.log('Connected!'));
redis.on('error', (err) => console.error('Redis Error:', err.message));

async function run() {
  try {
    await redis.ping();
    console.log("Ping successful!");
  } catch(e) {
    console.error("Ping failed:", e);
  } finally {
    process.exit(0);
  }
}

run();
