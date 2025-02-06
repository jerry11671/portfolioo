const {
  createExample,
  createAdmin,
  createUser,
  createTrail,
} = require("./createData");

const { connectDB, disconnectDB } = require("./dbConfig");

module.exports = {
  createExample,
  createAdmin,
  createUser,
  createTrail,
  connectDB,
  disconnectDB,
};
