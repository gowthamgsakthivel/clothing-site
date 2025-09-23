// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    usePathname: () => '/current-path',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
        return <img {...props} />
    },
}));

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-id',
        getToken: jest.fn().mockResolvedValue('test-token'),
    }),
    useUser: () => ({
        isLoaded: true,
        isSignedIn: true,
        user: {
            id: 'test-user-id',
            firstName: 'Test',
            lastName: 'User',
            fullName: 'Test User',
            imageUrl: 'https://example.com/image.jpg',
            publicMetadata: {},
        },
    }),
}));

// Global fetch mock
global.fetch = jest.fn();

// Suppress React error boundary warnings in test output
const originalConsoleError = console.error;
console.error = (...args) => {
    if (/Error boundaries should implement getDerivedStateFromError/.test(args[0])) {
        return;
    }
    originalConsoleError.call(console, ...args);
};