/**
 * Next.js Mocks
 * 
 * This file contains mock implementations for Next.js specific classes and functions.
 * It helps to isolate tests from Next.js runtime dependencies.
 */

// Add a simple test to satisfy Jest's requirement for at least one test per file
describe('Next.js mocks', () => {
    test('mock file exists', () => {
        expect(true).toBe(true);
    });
});

// Mock for Next/Server
jest.mock('next/server', () => {
    class NextRequest extends Request {
        constructor(input, init) {
            super(input, init);
            this.cookies = {
                get: jest.fn(),
                getAll: jest.fn(),
                set: jest.fn(),
                delete: jest.fn(),
                has: jest.fn(),
            };
            this.nextUrl = new URL(input);
        }
    }

    class NextResponse extends Response {
        static json(body, init) {
            return new NextResponse(
                JSON.stringify(body),
                {
                    ...init,
                    headers: {
                        ...init?.headers,
                        'content-type': 'application/json',
                    },
                }
            );
        }

        static redirect(url, init) {
            return new NextResponse(null, {
                ...init,
                status: 302,
                headers: {
                    ...init?.headers,
                    location: url,
                },
            });
        }
    }

    return {
        NextRequest,
        NextResponse,
    };
});

// Global Request definition to avoid "Request is not defined" errors
if (typeof globalThis.Request === 'undefined') {
    globalThis.Request = class Request {
        constructor(input, init = {}) {
            this.url = input;
            this.method = init.method || 'GET';
            this.headers = init.headers || {};
            this.body = init.body || null;
        }
    };
}

// Global Response definition
if (typeof globalThis.Response === 'undefined') {
    globalThis.Response = class Response {
        constructor(body, init = {}) {
            this.body = body;
            this.status = init.status || 200;
            this.statusText = init.statusText || '';
            this.headers = init.headers || {};
        }

        json() {
            return Promise.resolve(JSON.parse(this.body));
        }
    };
}

// Global URL definition
if (typeof globalThis.URL === 'undefined') {
    globalThis.URL = class URL {
        constructor(url) {
            this.href = url;
            this.pathname = '';
            this.search = '';
            this.searchParams = new Map();
        }
    };
}