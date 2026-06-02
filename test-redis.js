const IORedis = require('ioredis');
require('dotenv').config();

console.log("Connecting to Redis...");

let hasLoggedError = false;

const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {},
  retryStrategy(times) {
    // Retry every 10 seconds instead of immediately
    const delay = Math.min(times * 1000, 10000);
    return delay;
  }
});

// Override duplicate method to automatically attach error handler to any duplicated connections
const originalDuplicate = redis.duplicate.bind(redis);
redis.duplicate = function(overrideQueue) {
  console.log("[Test] duplicate() was called!");
  const dup = originalDuplicate(overrideQueue);
  dup.on('error', (err) => {
    if (!hasLoggedError) {
      console.error('Redis Duplicate Connection Error (will retry silently):', err.message);
      hasLoggedError = true;
    }
  });
  dup.on('connect', () => {
    hasLoggedError = false;
  });
  return dup;
};

redis.on('connect', () => {
  console.log('Connected successfully!');
  hasLoggedError = false;
});

redis.on('error', (err) => {
  if (!hasLoggedError) {
    console.error('Redis Connection Error (will retry silently):', err.message);
    hasLoggedError = true;
  }
});

async function run() {
  console.log("Creating a duplicate connection...");
  const dupRedis = redis.duplicate();
  
  try {
    console.log("Pinging Redis...");
    await redis.ping();
    console.log("Ping successful!");
  } catch(e) {
    console.error("Ping failed:", e.message);
  }
}

run();


