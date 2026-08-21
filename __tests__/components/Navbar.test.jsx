/**
 * Component Tests for Navbar (components/Navbar.jsx)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useAppContext } from '@/context/AppContext';
import { useClerk, UserButton } from '@clerk/nextjs';

jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
    useClerk: jest.fn(),
    UserButton: ({ children }) => <div data-testid="user-button">{children}</div>,
}));

UserButton.Action = ({ label, onClick }) => (
    <button data-testid={`user-action-${label}`} onClick={onClick}>
        {label}
    </button>
);

UserButton.MenuItems = ({ children }) => (
    <div data-testid="user-menu-items">{children}</div>
);

jest.mock('@/components/SearchBar', () => {
    return function DummySearchBar() {
        return <div data-testid="search-bar">Search Bar</div>;
    };
});

jest.mock('@/components/UnifiedNotificationIcon', () => {
    return function DummyNotificationIcon() {
        return <div data-testid="notifications" />;
    };
});

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => <img {...props} />,
}));

describe('Navbar Component', () => {
    const mockRouter = { push: jest.fn() };
    const mockOpenSignIn = jest.fn();
    const mockGetCartCount = jest.fn(() => 0);

    beforeEach(() => {
        jest.clearAllMocks();

        useAppContext.mockReturnValue({
            isAdmin: false,
            router: mockRouter,
            user: null,
            getCartCount: mockGetCartCount,
        });

        useClerk.mockReturnValue({
            openSignIn: mockOpenSignIn,
        });
    });

    test('renders primary navigation links and brand logo', () => {
        render(<Navbar />);

        expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Products').length).toBeGreaterThan(0);
        expect(screen.getAllByText('About Us').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
        expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    });

    test('displays login action when user is not authenticated and triggers sign in modal', () => {
        render(<Navbar />);

        const accountButtons = screen.getAllByText(/account/i);
        expect(accountButtons.length).toBeGreaterThan(0);

        fireEvent.click(accountButtons[0]);
        expect(mockOpenSignIn).toHaveBeenCalledTimes(1);
    });

    test('displays UserButton when user is authenticated', () => {
        useAppContext.mockReturnValue({
            isAdmin: false,
            router: mockRouter,
            user: { id: 'user-123' },
            getCartCount: mockGetCartCount,
        });

        render(<Navbar />);

        const userButtons = screen.getAllByTestId('user-button');
        expect(userButtons.length).toBeGreaterThan(0);
    });

    test('shows owner dashboard link when user is admin', () => {
        useAppContext.mockReturnValue({
            isAdmin: true,
            router: mockRouter,
            user: { id: 'admin-123' },
            getCartCount: mockGetCartCount,
        });

        render(<Navbar />);

        const ownerButtons = screen.getAllByText(/dashboard/i);
        expect(ownerButtons.length).toBeGreaterThan(0);

        fireEvent.click(ownerButtons[0]);
        expect(mockRouter.push).toHaveBeenCalledWith('/owner');
    });

    test('renders search trigger in desktop navigation', () => {
        render(<Navbar />);

        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
});
