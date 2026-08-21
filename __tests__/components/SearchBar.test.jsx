/**
 * Component Tests for SearchBar (components/SearchBar.jsx)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';
import { useAppContext } from '@/context/AppContext';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

describe('SearchBar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({
                success: true,
                suggestions: [],
                products: [],
            }),
        });
        useAppContext.mockReturnValue({
            router: mockRouter,
        });
    });

    test('renders the search trigger button correctly', () => {
        render(<SearchBar />);

        expect(screen.getByRole('button', { name: /open search/i })).toBeInTheDocument();
        expect(screen.getByText('Search products, brands or categories')).toBeInTheDocument();
    });

    test('opens mobile search overlay when trigger button is clicked', () => {
        render(<SearchBar />);

        const triggerButton = screen.getByRole('button', { name: /open search/i });
        fireEvent.click(triggerButton);

        expect(screen.getByPlaceholderText('Search products, brands or categories')).toBeInTheDocument();
    });

    test('updates query and navigates to search results page when submitted', () => {
        render(<SearchBar />);

        fireEvent.click(screen.getByRole('button', { name: /open search/i }));

        const searchInput = screen.getByPlaceholderText('Search products, brands or categories');
        fireEvent.change(searchInput, { target: { value: 'shoes' } });
        fireEvent.submit(searchInput.closest('form'));

        expect(mockRouter.push).toHaveBeenCalledWith('/search?q=shoes');
    });

    test('closes search overlay when back/close button is clicked', () => {
        render(<SearchBar />);

        fireEvent.click(screen.getByRole('button', { name: /open search/i }));
        expect(screen.getByPlaceholderText('Search products, brands or categories')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close search/i });
        fireEvent.click(closeButton);

        expect(screen.queryByPlaceholderText('Search products, brands or categories')).not.toBeInTheDocument();
    });
});
