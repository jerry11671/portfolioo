const environment = process.env.NODE_ENV;

const { createClient } = require("redis");
const logger = require("../logger");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient
  .connect()
  .then(() => logger.info("Connected to Redis"))
  .catch((error) => logger.error("Redis connection error:", error));

const storeSession = async (user_id, token) => {
  if (environment === "test") return;

  const key = `session:${user_id}`;

  await redisClient.SET(key, token, {
    EX: process.env.REDIS_USER_SESSION_TIME,
  });
};

const verifySession = async (user_id, token) => {
  if (environment === "test") return true;

  const storedToken = await redisClient.GET(`session:${user_id}`);
  return storedToken === token;
};

const deleteSession = async (user_id) => {
  if (environment === "test") return;

  const key = `session:${user_id}`;
  await redisClient.DEL(key);
};

// get or set cache
const redisCache = async (key, fetchDB) => {
  try {
    if (environment === "test") return;

    const cached_data = await redisClient.GET(key);

    if (cached_data) {
      return JSON.parse(cached_data);
    }

    const fetched_data = await fetchDB();

    // set if it does not already exist in redis db.
    await redisClient.SET(key, JSON.stringify(fetched_data), { NX: true });

    return fetched_data;
  } catch (error) {
    logger.error(`Error on reditCache for key "${key}":`, error);
    throw error;
  }
};

const rateLimiter = async (user_id) => {
  if (environment === "test") return;

  const limit = process.env.REDIS_REQUEST_RATE_LIMIT;
  const seconds = process.env.REDIS_REQUEST_RATE_LIMIT_TIME_WINDOW;

  const key = `rate_limit:${user_id}`;
  const count = await redisClient.INCR(key);

  // set key expiry time
  if (count === 1) {
    await redisClient.EXPIRE(key, seconds);
  }

  if (count > limit) return false;

  return true;
};

module.exports = {
  redisClient,
  redisCache,
  storeSession,
  verifySession,
  deleteSession,
  rateLimiter,
};
