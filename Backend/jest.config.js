// Backend/jest.config.js
export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  testTimeout: 30000,
  transform: {
    "^.+\\.js$": ["@swc/jest"],
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.js"],
  maxWorkers: 1, // Run tests sequentially
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
