/**
 * Component Tests for LoadingButton (components/LoadingButton.jsx)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingButton from '@/components/LoadingButton';

describe('LoadingButton Component', () => {
    test('renders button with label and responds to click events', () => {
        const handleClick = jest.fn();
        render(<LoadingButton onClick={handleClick}>Submit Order</LoadingButton>);

        const btn = screen.getByRole('button', { name: /submit order/i });
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();

        fireEvent.click(btn);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('disables button and displays loadingText when isLoading is true', () => {
        const handleClick = jest.fn();
        render(
            <LoadingButton isLoading={true} loadingText="Processing..." onClick={handleClick}>
                Submit Order
            </LoadingButton>
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(screen.getByText('Processing...')).toBeInTheDocument();

        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });
});
