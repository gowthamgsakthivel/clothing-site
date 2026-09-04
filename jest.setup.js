// Import Jest DOM extensions
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof global.Headers === 'undefined') {
    class MockHeaders extends Map {
        get(name) { return super.get(name.toLowerCase()) || null; }
        set(name, val) { return super.set(name.toLowerCase(), String(val)); }
    }
    global.Headers = MockHeaders;
}

if (typeof global.Request === 'undefined') {
    class MockRequest {
        constructor(input, init = {}) {
            const urlString = typeof input === 'string' ? input : input?.url || '';
            Object.defineProperty(this, 'url', { value: urlString, writable: true, configurable: true });
            this.method = init.method || 'GET';
            this.headers = new global.Headers(Object.entries(init.headers || {}));
            this.body = init.body;
        }
        async json() {
            return typeof this.body === 'string' ? JSON.parse(this.body) : (this.body || {});
        }
        async text() {
            return typeof this.body === 'string' ? this.body : JSON.stringify(this.body || {});
        }
    }
    global.Request = MockRequest;
}

if (typeof global.Response === 'undefined') {
    class MockResponse {
        constructor(body, init = {}) {
            this.body = body;
            this.status = init.status || 200;
            this.headers = new global.Headers(Object.entries(init.headers || {}));
        }
        async json() {
            return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
        }
        async text() {
            return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
        }
        static json(data, init = {}) {
            return new MockResponse(data, init);
        }
    }
    global.Response = MockResponse;
}

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