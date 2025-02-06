const developmentLogger = require("./developmentLogger");
const testLogger = require("./testLogger");
const productionLogger = require("./productionLogger");

const environment = process.env.NODE_ENV;

let logger;

if (environment === "development") {
  logger = developmentLogger();
} else if (environment === "production") {
  logger = productionLogger();
} else {
  logger = testLogger();
}

module.exports = logger;
