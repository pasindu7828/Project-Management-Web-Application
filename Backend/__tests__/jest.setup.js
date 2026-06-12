// Backend/__tests__/jest.setup.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Set environment variables for testing
  process.env.JWT_SECRET = "asdasdhsdsdkvcidwu";
  process.env.DEV_MODE = "test";

  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: "worksync-test",
    },
  });

  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 30000);

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

// Clear data before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (error) {
      // Ignore errors if collection doesn't exist
    }
  }
});
