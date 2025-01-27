const mongoose = require("mongoose");

const logger = require("../../logger");

const db_url = process.env.DATABASE_URL;

// Create connection to mongoDb
const createDbConnection = () => {
  mongoose
    .connect(db_url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => logger.info("Database connected"))
    .catch((err) => logger.error(err));
};

module.exports = createDbConnection;
