const { createLogger, format, transports } = require("winston");

const { combine, timestamp, label, printf, simple } = format;

const productionLogger = () => {
  return createLogger({
    level: "silly",
    format: simple(),
    transports: [new transports.Console()],
  });
};

module.exports = productionLogger;
