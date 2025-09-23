# Testing Documentation for Sparrow Sports

## Overview

This document outlines the testing approach for the Sparrow Sports e-commerce application. The project uses Jest and React Testing Library for unit and integration tests to ensure code quality and reliability.

## Testing Tools

- **Jest**: The JavaScript testing framework used as the test runner
- **React Testing Library**: For testing React components in a way that focuses on user behavior
- **Jest Mocks**: To isolate components and functions for true unit testing
- **MSW (Mock Service Worker)**: For mocking API responses when needed

## Test Types

### Unit Tests

Unit tests focus on testing individual components or functions in isolation:

- **Component Tests**: Verify component rendering, props handling, and user interactions
- **Function Tests**: Validate business logic and utility functions
- **Hook Tests**: Test custom React hooks behavior

### Integration Tests

Integration tests verify that multiple components work together:

- **Feature Tests**: Test complete user flows across multiple components
- **Context Tests**: Verify state management across component hierarchies
- **API Integration**: Test interactions between frontend and API

### End-to-End Tests

While primarily focusing on unit and integration tests, we may add E2E tests for critical paths:

- **User Journey Tests**: Test complete user flows from start to finish
- **Critical Path Tests**: Test important business processes like checkout

## Testing Standards

### Component Testing

1. Test component rendering with required props
2. Test user interactions (clicks, form inputs)
3. Test conditional rendering based on props
4. Test component state changes
5. Test error handling and edge cases

### Context Testing

1. Test provider initialization
2. Test state updates through actions/dispatches
3. Test context consumption in components
4. Test complex state logic and side effects

### API Testing

1. Test API route handlers
2. Test request and response formatting
3. Test error handling and edge cases
4. Use mock responses for predictable tests

## Code Coverage

Code coverage measures how much of your code is covered by tests. Our goal is to maintain high coverage for critical areas of the application.

### Coverage Metrics

- **Statements**: Percentage of code statements executed during tests
- **Branches**: Percentage of code branches (if/else) executed
- **Functions**: Percentage of functions called
- **Lines**: Percentage of code lines executed

### Generating Coverage Reports

```bash
npm run test:coverage
```

This will run tests and generate a coverage report in the `/coverage` directory.

### Coverage Goals

- **Critical Components**: 90%+ coverage
- **Business Logic**: 90%+ coverage 
- **Utility Functions**: 80%+ coverage
- **Overall**: 70%+ coverage

### Improving Coverage

1. Start by testing happy paths
2. Add tests for edge cases and error states
3. Identify and test complex conditional logic
4. Focus on testing business-critical code first

## Testing Best Practices

1. **Test Behavior, Not Implementation**: Focus on what users see and do
2. **Follow AAA Pattern**: Arrange, Act, Assert
3. **Mock External Dependencies**: Isolate the unit being tested
4. **Keep Tests Fast**: Tests should run quickly to encourage frequent runs
5. **Keep Tests Independent**: No test should depend on another test
6. **Use Descriptive Test Names**: Make it clear what is being tested
7. **Test Edge Cases**: Not just the happy path

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Single Test File

```bash
npm test -- path/to/file.test.js
```

## Performance Testing

Performance testing ensures that the application meets speed and responsiveness requirements, which are critical for e-commerce user experience.

### Performance Metrics

- **First Contentful Paint (FCP)**: Time until first content is rendered
- **Largest Contentful Paint (LCP)**: Time until largest content element is rendered
- **Time to Interactive (TTI)**: Time until the page is fully interactive
- **Total Blocking Time (TBT)**: Sum of time periods between FCP and TTI
- **Cumulative Layout Shift (CLS)**: Measures visual stability

### Performance Testing Tools

- **Lighthouse**: For comprehensive web vitals analysis
- **React DevTools Profiler**: For component rendering performance
- **WebPageTest**: For real-world performance testing

### Performance Testing Strategies

#### Client-Side Performance

1. **Component Rendering**: Test render time of complex components
2. **State Updates**: Measure time for state updates and re-renders
3. **Data Processing**: Test performance of data manipulations
4. **Animation Smoothness**: Ensure animations run at 60fps

#### API Performance

1. **Response Time**: Measure API endpoint response times
2. **Payload Size**: Monitor request/response payload sizes
3. **Query Efficiency**: Test database query performance

### Performance Budgets

We maintain performance budgets to ensure the application remains fast:

- **Total Bundle Size**: < 250KB (gzipped)
- **LCP**: < 2.5s
- **TTI**: < 3.5s
- **CLS**: < 0.1

### Running Performance Tests

```bash
# Run Lighthouse audit
npm run test:performance

# Profile component rendering
npm run profile-dev
```

## Writing New Tests

When writing new tests, please follow these guidelines:

1. Create test files with `.test.js` or `.test.jsx` extension
2. Place tests in the appropriate directory under `__tests__`
3. Test both the happy path and error cases
4. Mock external dependencies and API calls
5. Use descriptive test names that explain what is being tested
6. Keep tests focused and small - test one thing per test
7. Run tests frequently during development

## Test Directory Structure

```
__tests__/
├── components/       # Component tests
├── context/          # Context tests
├── hooks/            # Custom hooks tests
├── pages/            # Page component tests
├── api/              # API route tests
├── utils/            # Utility function tests
└── features/         # Integration tests for complete features
```

## Continuous Integration

Tests are automatically run as part of our CI pipeline to ensure code quality before deployment.

## Contact

If you have questions about our testing approach, contact the development team.