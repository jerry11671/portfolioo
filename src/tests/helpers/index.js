const { createUser, createExample, createTrail } = require("./createData");

const { connectDB, disconnectDB } = require("./dbConfig");

module.exports = {
  createUser,
  createExample,
  createTrail,
  connectDB,
  disconnectDB,
};
