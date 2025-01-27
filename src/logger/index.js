const developmentLogger = require("./developmentLogger");
const testLogger = require("./testLogger");
const productionLogger = require("./productionLogger");

const environment = process.env.NODE_ENV;

var logger;

logger = testLogger();

if (environment == "development") {
  logger = developmentLogger();
}

if (environment == "production") {
  logger = productionLogger();
}

module.exports = logger;
