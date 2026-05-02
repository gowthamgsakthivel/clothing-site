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
        const { src, alt, width, height, style, fill, sizes, priority, placeholder, ...rest } = props || {};
        const imgStyle = { ...(style || {}) };
        if (fill) {
            imgStyle.objectFit = imgStyle.objectFit || 'cover';
            // do not pass `fill` to the DOM element
        }
        // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
        return <img src={src} alt={alt} width={width} height={height} style={imgStyle} {...rest} />
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

// Ensure window.scrollTo is available (JSDOM provides a throwing stub)
if (typeof global.window !== 'undefined') {
    global.window.scrollTo = () => {};
}

// Mock database connection used by API routes so tests don't attempt a real connection
jest.mock('@/config/db', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(true),
}));

// Leave console.error untouched so tests can surface intentional errors