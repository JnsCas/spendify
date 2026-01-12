module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.test\\.ts$',
  testPathIgnorePatterns: ['<rootDir>/test/e2e/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.entity.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/migrations/**',
    '!src/main.ts',
    '!src/config/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
