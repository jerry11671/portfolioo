const {
  createExample,
  createAdmin,
  createUser,
  createNotification,
  createTrail,
} = require("./createData");

const { connectDB, disconnectDB } = require("./dbConfig");

module.exports = {
  createExample,
  createAdmin,
  createUser,
  createNotification,
  createTrail,
  connectDB,
  disconnectDB,
};
