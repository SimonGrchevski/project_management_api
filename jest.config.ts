/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    globals: {
      "ts-jest": {
        isolatedModules: true,
      },
    },
  };
  