const { createLogger, format, transports } = require("winston");

const { simple } = format;

const testLogger = () => {
  return createLogger({
    level: "silly",
    format: simple(),
    transports: [new transports.Console()],
  });
};

module.exports = testLogger;
