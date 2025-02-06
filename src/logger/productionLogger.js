const { createLogger, format, transports } = require("winston");

const { simple } = format;

const IS_CONSOLE_LOGGING_ENABLED = false; // enable or disable console logging

const baseLogger = () => {
  return createLogger({
    level: "silly",
    format: simple(),
    transports: [new transports.Console()],
  });
};

const productionLogger = () => {
  const logger = baseLogger();

  // override the log method
  logger.log = function (message, level = "debug") {
    if (IS_CONSOLE_LOGGING_ENABLED) {
      console.log(`${level}:`, message);
    }
  };

  return logger;
};

module.exports = productionLogger;
