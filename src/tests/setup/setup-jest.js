const { connectDB, disconnectDB } = require("../helpers/index");

beforeAll(async () => {
  connectDB();
});

afterAll(async () => {
  disconnectDB();
});
