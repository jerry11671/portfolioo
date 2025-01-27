require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const environment = process.env.NODE_ENV;
const http = require("http");
const logger = require("./src/logger");
const createDbConnection = require("./src/models/db");

if (environment == "production") {
  require("newrelic");
}

const app = require("./app");
const port = process.env.PORT || 2000;

// Connects to mongodb
createDbConnection();

http.createServer(app).listen(port);
logger.info(`Started server at port: ${port}`);
