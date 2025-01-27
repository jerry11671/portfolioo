const { createLogger, format, transports } = require("winston");

const { simple } = format;

const developmentLogger = () => {
  return createLogger({
    level: "silly",
    format: simple(),
    transports: [new transports.Console()],
  });
};

module.exports = developmentLogger;
