/**
 * Navbar Component Tests
 * 
 * This test suite verifies the functionality of the Navbar component, which is 
 * responsible for site navigation and user-related actions.
 * 
 * Tests include:
 * - Rendering navigation links
 * - Responsive behavior on different screen sizes
 * - User authentication state handling
 * - Search functionality
 * - Seller dashboard access
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useAppContext } from '@/context/AppContext';
import { useClerk, UserButton } from '@clerk/nextjs';
import SearchBar from '@/components/SearchBar';

// Mock the dependencies
jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
    useClerk: jest.fn(),
    UserButton: ({ children }) => <div data-testid="user-button">{children}</div>,
}));

// Mock the UserButton.Action and UserButton.MenuItems components
UserButton.Action = ({ label, onClick }) => (
    <button data-testid={`user-action-${label}`} onClick={onClick}>
        {label}
    </button>
);

UserButton.MenuItems = ({ children }) => (
    <div data-testid="user-menu-items">{children}</div>
);

jest.mock('@/components/SearchBar', () => {
    return function DummySearchBar({ showResultsInline }) {
        return <div data-testid="search-bar" data-inline={showResultsInline}>Search Bar</div>;
    };
});

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => <img {...props} />,
}));

describe('Navbar', () => {
    // Default mocked values
    const mockRouter = { push: jest.fn() };
    const mockOpenSignIn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Default context values for a regular user
        useAppContext.mockReturnValue({
            isSeller: false,
            router: mockRouter,
            user: null,
        });

        useClerk.mockReturnValue({
            openSignIn: mockOpenSignIn,
        });
    });

    test('renders navigation links correctly', () => {
        render(<Navbar />);

        // Check for main navigation links
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();

        // Check logo is present
        expect(screen.getByAltText('logo')).toBeInTheDocument();
    });

    test('shows login button when user is not authenticated', () => {
        render(<Navbar />);

        // Check for Account button - we need to use getAllByText since there might be multiple
        // Account buttons (mobile and desktop views)
        const accountButtons = screen.getAllByText('Account');
        expect(accountButtons.length).toBeGreaterThan(0);

        // Test click behavior using the first button
        fireEvent.click(accountButtons[0]);
        expect(mockOpenSignIn).toHaveBeenCalledTimes(1);
    });

    test('shows user button when user is authenticated', () => {
        // Mock an authenticated user
        useAppContext.mockReturnValue({
            isSeller: false,
            router: mockRouter,
            user: { id: 'user-123' },
        });

        render(<Navbar />);

        // Check UserButton is displayed - use getAllByTestId since there might be multiple
        const userButtons = screen.getAllByTestId('user-button');
        expect(userButtons.length).toBeGreaterThan(0);
        expect(screen.queryByText('Account')).not.toBeInTheDocument();

        // Check for user menu items - use getAllByTestId since there might be multiple
        const cartActions = screen.getAllByTestId('user-action-Cart');
        expect(cartActions.length).toBeGreaterThan(0);

        const orderActions = screen.getAllByTestId('user-action-My Orders');
        expect(orderActions.length).toBeGreaterThan(0);
    });

    test('shows seller dashboard button for sellers', () => {
        // Mock a seller user
        useAppContext.mockReturnValue({
            isSeller: true,
            router: mockRouter,
            user: { id: 'seller-123' },
        });

        render(<Navbar />);

        // Check for seller dashboard button
        const sellerButtons = screen.getAllByText('Seller Dashboard');
        expect(sellerButtons.length).toBeGreaterThan(0);

        // Test navigation behavior
        fireEvent.click(sellerButtons[0]);
        expect(mockRouter.push).toHaveBeenCalledWith('/seller');
    });

    test('toggles mobile search bar when search icon is clicked', () => {
        // Use window.matchMedia to simulate mobile view
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: true, // Simulate narrow viewport
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
        }));

        render(<Navbar />);

        // Search bar should be hidden initially on mobile
        expect(screen.queryAllByTestId('search-bar')).toHaveLength(1); // Only desktop search bar

        // Find and click the search button (mobile only)
        const searchButton = screen.getByLabelText('Search');
        fireEvent.click(searchButton);

        // Now there should be two search bars (desktop and mobile)
        expect(screen.queryAllByTestId('search-bar')).toHaveLength(2);

        // Click again to hide
        fireEvent.click(searchButton);

        // Back to just the desktop search bar
        expect(screen.queryAllByTestId('search-bar')).toHaveLength(1);
    });

    test('navigates to home page when logo is clicked', () => {
        render(<Navbar />);

        // Find and click the logo
        const logo = screen.getByAltText('logo');
        fireEvent.click(logo);

        // Should navigate to home page
        expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    test('renders inline search bar on desktop', () => {
        render(<Navbar />);

        // Find the search bar in the desktop view
        const searchBar = screen.getByTestId('search-bar');

        // Check that it has the inline prop set
        expect(searchBar).toHaveAttribute('data-inline', 'true');
    });

    test('user menu actions navigate to correct pages', () => {
        // Mock an authenticated user
        useAppContext.mockReturnValue({
            isSeller: false,
            router: mockRouter,
            user: { id: 'user-123' },
        });

        render(<Navbar />);

        // Click on Cart action - use getAllByTestId and click the first one
        const cartActions = screen.getAllByTestId('user-action-Cart');
        fireEvent.click(cartActions[0]);
        expect(mockRouter.push).toHaveBeenCalledWith('/cart');

        // Reset the mock to check next call
        mockRouter.push.mockClear();

        // Click on My Orders action - use getAllByTestId and click the first one
        const orderActions = screen.getAllByTestId('user-action-My Orders');
        fireEvent.click(orderActions[0]);
        expect(mockRouter.push).toHaveBeenCalledWith('/my-orders');
    });
});