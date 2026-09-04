/**
 * Component Tests for ProductCard (components/ProductCard.jsx)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';
import { useAppContext } from '@/context/AppContext';

const mockRouter = { push: jest.fn() };
const mockAddFavorite = jest.fn();
const mockRemoveFavorite = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

const mockProductBundle = {
    product: {
        _id: 'prod-123',
        name: 'Pro Soccer Cleats',
        description: 'Elite level sports footwear',
        category: 'Shoes'
    },
    variants: [
        {
            _id: 'var-1',
            productId: 'prod-123',
            color: 'Dark Green',
            colorCode: '#006400',
            size: '9',
            originalPrice: 2000,
            offerPrice: 1500,
            images: ['https://example.com/shoes.jpg']
        }
    ],
    inventoryByVariantId: {
        'var-1': { totalStock: 4, reservedStock: 0, lowStockThreshold: 5 }
    }
};

describe('ProductCard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAppContext.mockReturnValue({
            currency: '₹',
            router: mockRouter,
            favorites: [],
            addFavorite: mockAddFavorite,
            removeFavorite: mockRemoveFavorite,
            user: { id: 'user-1' }
        });
    });

    test('renders product name, prices, image and Buy button', () => {
        render(<ProductCard product={mockProductBundle} />);

        expect(screen.getByText('Pro Soccer Cleats')).toBeInTheDocument();
        expect(screen.getByText('₹1500')).toBeInTheDocument();
        expect(screen.getByText('₹2000')).toBeInTheDocument();
        expect(screen.getByText('Buy')).toBeInTheDocument();
        expect(screen.getByAltText('Pro Soccer Cleats')).toBeInTheDocument();
    });

    test('displays low stock indicator when total stock is low', () => {
        render(<ProductCard product={mockProductBundle} />);

        expect(screen.getByText(/only.*left/i)).toBeInTheDocument();
    });

    test('navigates to product detail page when card is clicked', () => {
        render(<ProductCard product={mockProductBundle} />);

        fireEvent.click(screen.getByText('Pro Soccer Cleats'));

        expect(mockRouter.push).toHaveBeenCalledWith('/product/prod-123');
    });

    test('toggles wishlist favorite when heart button is clicked', () => {
        render(<ProductCard product={mockProductBundle} />);

        const heartBtn = screen.getByRole('button', { name: /add to wishlist/i });
        fireEvent.click(heartBtn);

        expect(mockAddFavorite).toHaveBeenCalledWith('prod-123');
    });

    test('calls removeFavorite when item is already in favorites', () => {
        useAppContext.mockReturnValue({
            currency: '₹',
            router: mockRouter,
            favorites: ['prod-123'],
            addFavorite: mockAddFavorite,
            removeFavorite: mockRemoveFavorite,
            user: { id: 'user-1' }
        });

        render(<ProductCard product={mockProductBundle} />);

        const heartBtn = screen.getByRole('button', { name: /remove from wishlist/i });
        fireEvent.click(heartBtn);

        expect(mockRemoveFavorite).toHaveBeenCalledWith('prod-123');
    });
});
