module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    modulePathIgnorePatterns: ["<rootDir>/dist"],
    setupFilesAfterEnv: ["<rootDir>/src/test/jest.setup.ts"],
};