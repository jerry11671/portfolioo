require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const express = require("express");
const routes = require("./src/routes");
const logger = require("./src/logger");
const morganBody = require("morgan-body");
const bodyParser = require("body-parser");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const environment = process.env.NODE_ENV;
const cors = require("cors");
const { handleError } = require("./src/middleware/error");

// disable console methods globally
/* eslint-disable no-empty-function */
/* eslint-disable no-console */
console.log = function () {};
console.info = function () {};
console.warn = function () {};
console.error = function () {};
/* eslint-disable no-console */
/* eslint-enable no-empty-function */

const app = express();

app.use(bodyParser.json());

// returns the real client's IP
// even if client is behind a proxy
app.set("trust proxy", true);

// data sanitization against query injection
app.use(mongoSanitize());

// compress all payload size
app.use(compression());

// logging
if (environment == "development") {
  morganBody(app);
}

//logging
if (environment == "development") {
  morganBody(app);
} else {
  const loggerStream = {
    write: (message) => {
      logger.info(message);
    },
  };
  morganBody(app, {
    noColors: true,
    includeNewLine: false,
    logAllReqHeader: true,
    prettify: false,
    stream: loggerStream,
  });
}

app.use(cors());

// routes
app.use("/api", routes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  handleError(err, req, res);
});

module.exports = app;
