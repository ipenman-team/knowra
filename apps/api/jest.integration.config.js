module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@knowra/slate-converters$': '<rootDir>/../../packages/slate-converters/src/index.ts',
  },
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/test/integration/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
