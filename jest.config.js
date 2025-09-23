const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        // Handle module aliases (this will be automatically configured for you soon)
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/pages/(.*)$': '<rootDir>/pages/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/config/(.*)$': '<rootDir>/config/$1',
        '^@/models/(.*)$': '<rootDir>/models/$1',
        '^@/assets/(.*)$': '<rootDir>/assets/$1',
        '^@/context/(.*)$': '<rootDir>/context/$1',
    },
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/'
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!bson|mongodb|mongoose).+\\.js$',
        '^.+\\.module\\.(css|sass|scss)$',
    ],
    moduleDirectories: ['node_modules', '<rootDir>'],
    // Configure code coverage collection
    collectCoverageFrom: [
        'components/**/*.{js,jsx,ts,tsx}',
        'app/**/*.{js,jsx,ts,tsx}',
        'context/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        '!**/node_modules/**',
        '!**/.next/**',
    ],
    // Set coverage thresholds
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
        },
        'components/ProductCard.jsx': {
            statements: 90,
            branches: 90,
        },
        'components/SearchBar.jsx': {
            statements: 90,
            branches: 90,
        },
    },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);