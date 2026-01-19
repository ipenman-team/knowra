module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/test/integration/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
