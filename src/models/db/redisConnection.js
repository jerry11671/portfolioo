const Redis = require('ioredis');
const logger = require("../../logger");

let redisClient = null;

const lib = {

  async connect() {
    // If client already exists and is connected, return it
    if (redisClient && redisClient.status === 'ready') {
      return redisClient;
    }

    try {
      redisClient = new Redis(process.env.REDIS_URL);
      
      // Set up event listeners
      redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });
      
      redisClient.on('connect', () => {
        logger.info('Connected to Redis');
      });
      
      redisClient.on('reconnecting', () => {
        logger.info('Reconnecting to Redis...');
      });
      
      // Wait for connection to be ready
      await new Promise((resolve) => {
        if (redisClient.status === 'ready') {
          resolve();
        } else {
          redisClient.once('ready', resolve);
        }
      });
      
      return redisClient;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  },

  /**
   * Get the Redis client instance
   * @returns {Redis|null} Redis client or null if not connected
   */
  getClient() {
    return redisClient;
  },

  async disconnect() {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Disconnected from Redis');
    }
  }
};

module.exports = lib;