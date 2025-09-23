/**
 * ProductCard Component Tests
 * 
 * These tests verify the functionality of the ProductCard component, which displays
 * product information and allows users to navigate to product details and manage favorites.
 * 
 * Test coverage includes:
 * - Rendering product information correctly
 * - Stock availability indicator
 * - Navigation to product detail page
 * - Adding/removing products from favorites
 * - User authentication state affecting favorites functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';
import { mockProducts } from '../utils/test-utils';
import { useAppContext } from '@/context/AppContext';

// Mock the AppContext to control the testing environment and isolate the component
// This allows us to simulate different states like logged-in users, favorites, etc.
jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

describe('ProductCard', () => {
    const mockAddFavorite = jest.fn();
    const mockRemoveFavorite = jest.fn();
    const mockRouter = { push: jest.fn() };
    const mockProduct = mockProducts[0];

    beforeEach(() => {
        jest.clearAllMocks();
        // Default context values
        useAppContext.mockReturnValue({
            currency: '$',
            router: mockRouter,
            favorites: [],
            addFavorite: mockAddFavorite,
            removeFavorite: mockRemoveFavorite,
            user: { id: 'test-user' },
        });
    });

    test('renders the product card with correct information', () => {
        render(<ProductCard product={mockProduct} />);

        // Check that basic product info is displayed
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
        expect(screen.getByText(`$${mockProduct.offerPrice}`)).toBeInTheDocument();

        // Check that the image is rendered
        const productImage = screen.getAllByAltText(mockProduct.name)[0];
        expect(productImage).toBeInTheDocument();
        expect(productImage).toHaveAttribute('src');

        // Check that the "Buy now" button exists
        expect(screen.getByText('Buy now')).toBeInTheDocument();
    });

    test('shows "Only few left" badge when stock is low', () => {
        const lowStockProduct = { ...mockProduct, stock: 5 };
        render(<ProductCard product={lowStockProduct} />);

        expect(screen.getByText('Only few left')).toBeInTheDocument();
    });

    test('does not show "Only few left" badge when stock is sufficient', () => {
        const sufficientStockProduct = { ...mockProduct, stock: 20 };
        render(<ProductCard product={sufficientStockProduct} />);

        expect(screen.queryByText('Only few left')).not.toBeInTheDocument();
    });

    test('navigates to product detail page when clicked', () => {
        render(<ProductCard product={mockProduct} />);

        fireEvent.click(screen.getByText(mockProduct.name));

        expect(mockRouter.push).toHaveBeenCalledWith(`/product/${mockProduct._id}`);
    });

    test('adds product to favorites when heart icon is clicked', () => {
        render(<ProductCard product={mockProduct} />);

        const favoriteButton = screen.getByRole('button', { name: 'Add to favorites' });
        fireEvent.click(favoriteButton);

        expect(mockAddFavorite).toHaveBeenCalledWith(mockProduct._id);
    });

    test('removes product from favorites when heart icon is clicked and product is already in favorites', () => {
        // Set up the product as already favorited
        useAppContext.mockReturnValue({
            currency: '$',
            router: mockRouter,
            favorites: [mockProduct._id],
            addFavorite: mockAddFavorite,
            removeFavorite: mockRemoveFavorite,
            user: { id: 'test-user' },
        });

        render(<ProductCard product={mockProduct} />);

        const favoriteButton = screen.getByRole('button', { name: 'Remove from favorites' });
        fireEvent.click(favoriteButton);

        expect(mockRemoveFavorite).toHaveBeenCalledWith(mockProduct._id);
    });

    test('does not call favorite functions when user is not logged in', () => {
        // Setup with no user logged in
        useAppContext.mockReturnValue({
            currency: '$',
            router: mockRouter,
            favorites: [],
            addFavorite: mockAddFavorite,
            removeFavorite: mockRemoveFavorite,
            user: null,
        });

        render(<ProductCard product={mockProduct} />);

        const favoriteButton = screen.getByRole('button', { name: 'Add to favorites' });
        fireEvent.click(favoriteButton);

        // Verify no favorite functions were called
        expect(mockAddFavorite).not.toHaveBeenCalled();
        expect(mockRemoveFavorite).not.toHaveBeenCalled();
    });
});