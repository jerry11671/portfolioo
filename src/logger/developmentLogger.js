const { createLogger, format, transports } = require("winston");

const { simple } = format;

const CONSOLE_LOGGING_ENABLED = false; //  disable or enable console logging

const baseLogger = () => {
  return createLogger({
    level: "silly",
    format: simple(),
    transports: [new transports.Console()],
  });
};

const developmentLogger = {
  ...baseLogger,
  log: function (message) {
    if (CONSOLE_LOGGING_ENABLED) {
      baseLogger.log(message);
    }
  },
};

module.exports = developmentLogger;
