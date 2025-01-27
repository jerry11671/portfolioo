const mongoose = require("mongoose");

const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  const mongoServer = await MongoMemoryServer.create();
  return await mongoose.connect(mongoServer.getUri(), {
    dbName: "mcr-jest-test",
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
};

const disconnectDB = () => {
  return async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
    await mongoose.connection.dropDatabase();
  };
};

module.exports = { connectDB, disconnectDB };
