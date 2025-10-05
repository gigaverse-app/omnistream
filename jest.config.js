export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'demo/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/types/**',
    '!demo/**/*.test.ts',
    '!demo/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 40,
      lines: 45,
      statements: 45,
    },
  },
  testMatch: [
    '**/__tests__/unit/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
    'demo/**/*.test.ts',
    'examples/**/tests/**/*.test.{ts,js}',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__tests__/integration/'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: false,
  maxWorkers: '50%',
};
