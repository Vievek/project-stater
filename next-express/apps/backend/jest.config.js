/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src'],
  // Transform all node_modules to ensure ESM is handled
  transformIgnorePatterns: [],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
