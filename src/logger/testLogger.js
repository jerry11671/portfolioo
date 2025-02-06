const { createLogger, format, transports } = require("winston");
const { simple } = format;

const environment = process.env.NODE_ENV;
const IS_CONSOLE_LOGGING_ENABLED = true; // enable or disable console logging

const baseLogger = () => {
  return createLogger({
    level: "silly",
    format: simple(),
    transports: [new transports.Console()],
  });
};

const testLogger = () => {
  const logger = baseLogger();

  if (environment === "test") {
    // Override all log methods except logger.log() in test mode
    logger.info = logger.warn = logger.error = () => {}; // No-op functions
  }

  // override the log method
  logger.log = function (message, level = "debug") {
    if (IS_CONSOLE_LOGGING_ENABLED) {
      console.log(`${level}:`, message);
    }
  };

  return logger;
};

module.exports = testLogger;
