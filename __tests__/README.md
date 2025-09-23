# Testing Guide for Sparrow Sports

## Getting Started with Testing

This guide helps you understand how to run existing tests and create new ones for the Sparrow Sports e-commerce application.

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run a Specific Test File

```bash
npm test -- __tests__/components/ProductCard.test.jsx
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

## Writing Tests

### Component Tests

For React components, place your tests in `__tests__/components/`. Example structure:

```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '@/components/YourComponent';
import { useAppContext } from '@/context/AppContext';

// Mock dependencies
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

describe('YourComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock return values
    useAppContext.mockReturnValue({
      // Mock context values
    });
  });

  test('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<YourComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
    // Assert expected behavior
  });
});
```

### Context Tests

For testing contexts, place your tests in `__tests__/context/`:

```jsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { YourContextProvider, useYourContext } from '@/context/YourContext';

// Create a test component to consume context
const TestComponent = () => {
  const context = useYourContext();
  return (
    <div>
      <div data-testid="value">{context.value}</div>
      <button onClick={context.updateValue}>Update</button>
    </div>
  );
};

describe('YourContext', () => {
  test('provides initial values', () => {
    render(
      <YourContextProvider>
        <TestComponent />
      </YourContextProvider>
    );
    
    expect(screen.getByTestId('value')).toHaveTextContent('initial value');
  });

  test('updates value when action is called', () => {
    render(
      <YourContextProvider>
        <TestComponent />
      </YourContextProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    });
    
    expect(screen.getByTestId('value')).toHaveTextContent('updated value');
  });
});
```

### API Route Tests

For testing API routes, place your tests in `__tests__/api/`:

```js
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/your-route/route';
import YourModel from '@/models/YourModel';

// Mock dependencies
jest.mock('@/config/db', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/YourModel', () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

describe('Your API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET handler returns correct data', async () => {
    // Setup mocks
    YourModel.find.mockResolvedValue([{ _id: '1', name: 'Test' }]);
    
    // Create mock request
    const req = new NextRequest('http://localhost/api/your-route');
    
    // Call API handler
    const response = await GET(req);
    const data = await response.json();
    
    // Assert response
    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe('Test');
  });
});
```

## Testing Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it.
2. **Use accessible queries**: Prefer queries like `getByRole`, `getByLabelText` over `getByTestId`.
3. **Test user flows**: Think like a user when writing tests.
4. **Isolate tests**: Each test should be independent and not rely on other tests.
5. **Mock external dependencies**: Use Jest's mocking capabilities to isolate the code being tested.
6. **Test edge cases**: Don't just test the happy path.
7. **Keep tests simple**: One assertion per test is ideal.
8. **Use descriptive test names**: Make it clear what's being tested.

## Common Testing Patterns

### Testing Async Code

```jsx
test('loads data asynchronously', async () => {
  // Mock async function
  mockFetchData.mockResolvedValue({ data: 'test' });
  
  render(<AsyncComponent />);
  
  // Initial state
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Wait for async operation to complete
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
```

### Testing Forms

```jsx
test('submits form with user input', async () => {
  const handleSubmit = jest.fn();
  
  render(<Form onSubmit={handleSubmit} />);
  
  // Fill form fields
  fireEvent.change(screen.getByLabelText('Name'), { 
    target: { value: 'John Doe' } 
  });
  
  fireEvent.change(screen.getByLabelText('Email'), { 
    target: { value: 'john@example.com' } 
  });
  
  // Submit form
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  // Assert form submission
  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com'
  });
});
```

### Testing Error States

```jsx
test('displays error message when API call fails', async () => {
  // Mock API error
  mockApi.mockRejectedValue(new Error('Failed to fetch'));
  
  render(<DataComponent />);
  
  // Wait for error state
  await waitFor(() => {
    expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
  });
});
```

## Jest Matchers Quick Reference

- `toBeInTheDocument()`: Element exists in the document
- `toHaveTextContent()`: Element contains text
- `toHaveClass()`: Element has CSS class
- `toBeDisabled()`: Element is disabled
- `toHaveAttribute()`: Element has attribute
- `toHaveStyle()`: Element has style
- `toHaveValue()`: Form element has value
- `toBeChecked()`: Checkbox is checked
- `toHaveBeenCalled()`: Function was called
- `toHaveBeenCalledWith()`: Function was called with arguments

## Troubleshooting

### Test Fails with "Unable to find element"

- Check if the element is actually rendered
- Check if the element is conditionally rendered
- Check if the query is correct

### Mock Function Not Being Called

- Check if you're using the mocked function correctly
- Check if the component is actually calling the function
- Check if there are conditions preventing the function call

### Test Timeout

- Check for unresolved promises
- Check for infinite loops
- Try using longer timeouts for complex async operations

For more help, refer to the main [TESTING.md](../TESTING.md) documentation or reach out to the development team.