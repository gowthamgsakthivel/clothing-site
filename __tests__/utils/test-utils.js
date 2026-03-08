import React from 'react';
import { render } from '@testing-library/react';
// Create a mock version of the AppContext
import * as AppContextModule from '@/context/AppContext';

// Add a simple test to satisfy Jest's requirement for at least one test per file
describe('Test utilities', () => {
    test('renderWithProviders is defined', () => {
        expect(typeof renderWithProviders).toBe('function');
    });
});
// Add a simple test to satisfy Jest's requirement for at least one test per file
describe('Test utilities', () => {
    test('renderWithProviders function exists', () => {
        expect(typeof renderWithProviders).toBe('function');
    });
});

// Mock the AppContext values
const mockAppContextValue = {
    user: { id: 'test-user' },
    getToken: jest.fn().mockResolvedValue('test-token'),
    currency: '₹',
    router: { push: jest.fn() },
    isAdmin: false,
    setIsAdmin: jest.fn(),
    userData: null,
    fetchUserData: jest.fn(),
    products: [],
    fetchProductData: jest.fn(),
    searchProducts: jest.fn(),
    cartItems: {},
    setCartItems: jest.fn(),
    addToCart: jest.fn(),
    updateCartQuantity: jest.fn(),
    getCartCount: jest.fn().mockReturnValue(0),
    getCartAmount: jest.fn().mockReturnValue(0),
    favorites: [],
    fetchFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    loadingStates: {
        products: false,
        userData: false,
        cart: false,
        favorites: false,
        search: false
    },
    setLoadingStates: jest.fn()
};

// Create a mock AppContextProvider that just renders children
const MockAppContextProvider = ({ children }) => {
    return <>{children}</>;
};

// Helper function to render components with context providers
export function renderWithProviders(ui, options = {}) {
    return render(ui, {
        wrapper: ({ children }) => (
            <MockAppContextProvider>
                {children}
            </MockAppContextProvider>
        ),
        ...options,
    });
}

// Mock product data for tests
export const mockProducts = [
    {
        product: {
            _id: 'product-1',
            name: 'Test Product 1',
            description: 'This is test product 1',
            brand: 'Test Brand',
            category: 'Shirts',
            genderCategory: 'Unisex',
            slug: 'test-product-1',
            createdAt: new Date('2023-01-01')
        },
        variants: [
            {
                _id: 'variant-1',
                productId: 'product-1',
                color: 'Red',
                size: 'M',
                sku: 'SKU-1',
                originalPrice: 1000,
                offerPrice: 800,
                visibility: 'visible',
                images: ['https://example.com/image1.jpg']
            }
        ],
        inventoryByVariantId: {
            'variant-1': {
                variantId: 'variant-1',
                totalStock: 10,
                reservedStock: 0,
                lowStockThreshold: 5
            }
        }
    },
    {
        product: {
            _id: 'product-2',
            name: 'Test Product 2',
            description: 'This is test product 2',
            brand: 'Test Brand',
            category: 'Pants',
            genderCategory: 'Unisex',
            slug: 'test-product-2',
            createdAt: new Date('2023-01-02')
        },
        variants: [
            {
                _id: 'variant-2',
                productId: 'product-2',
                color: 'Black',
                size: 'L',
                sku: 'SKU-2',
                originalPrice: 1500,
                offerPrice: 1200,
                visibility: 'visible',
                images: ['https://example.com/image2.jpg']
            }
        ],
        inventoryByVariantId: {
            'variant-2': {
                variantId: 'variant-2',
                totalStock: 5,
                reservedStock: 0,
                lowStockThreshold: 5
            }
        }
    }
];

// Mock user data for tests
export const mockUserData = {
    _id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    cartItems: {
        'product-1': 2,
        'product-2_Black': 1
    },
    addresses: [
        {
            _id: 'address-1',
            name: 'Home',
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'Test Country',
            isDefault: true
        }
    ]
};

// Mock order data for tests
export const mockOrders = [
    {
        _id: 'order-1',
        user: 'user-1',
        products: [
            {
                productId: 'product-1',
                name: 'Test Product 1',
                price: 800,
                quantity: 2,
                color: 'Red',
                size: 'M'
            }
        ],
        totalAmount: 1600,
        shippingAddress: mockUserData.addresses[0],
        paymentStatus: 'completed',
        orderStatus: 'processing',
        date: new Date('2023-01-10')
    }
];