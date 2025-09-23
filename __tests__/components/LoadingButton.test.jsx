/**
 * LoadingButton Component Tests
 * 
 * These tests verify the LoadingButton component's functionality:
 * - Rendering normal and loading states correctly
 * - Displaying spinner during loading
 * - Handling disabled state appropriately
 * - Processing click events correctly
 * - Supporting custom button types and classes
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingButton from '@/components/LoadingButton';

describe('LoadingButton', () => {
    // Create a mock function for the onClick handler
    const mockOnClick = jest.fn();

    // Reset all mocks before each test to ensure clean testing environment
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders button with children when not loading', () => {
        render(
            <LoadingButton onClick={mockOnClick} className="test-class">
                Click Me
            </LoadingButton>
        );

        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Click Me');
        expect(button).toHaveClass('test-class');
        expect(button).not.toHaveClass('cursor-not-allowed');
        expect(button).not.toHaveClass('opacity-80');
    });

    test('renders loading state correctly', () => {
        render(
            <LoadingButton isLoading onClick={mockOnClick} loadingText="Processing...">
                Click Me
            </LoadingButton>
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('cursor-not-allowed');
        expect(button).toHaveClass('opacity-80');

        // Check for loading spinner
        const spinner = document.querySelector('svg.animate-spin');
        expect(spinner).toBeInTheDocument();

        // The text should be invisible - we need to use a different approach since it's invisible
        // We need to find the span that contains the text, regardless of visibility
        const invisibleSpan = button.querySelector('span.invisible');
        expect(invisibleSpan).toBeInTheDocument();
        expect(invisibleSpan).toHaveTextContent('Processing...');
    });

    test('disables the button when isLoading is true', () => {
        render(
            <LoadingButton isLoading onClick={mockOnClick}>
                Click Me
            </LoadingButton>
        );

        const button = screen.getByRole('button');

        // Attempt to click the button
        fireEvent.click(button);

        // onClick should not be called because button is disabled
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('disables the button when disabled prop is true', () => {
        render(
            <LoadingButton disabled onClick={mockOnClick}>
                Click Me
            </LoadingButton>
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('cursor-not-allowed');
        expect(button).toHaveClass('opacity-80');

        // Attempt to click the button
        fireEvent.click(button);

        // onClick should not be called because button is disabled
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('calls onClick when button is clicked and not disabled', () => {
        render(
            <LoadingButton onClick={mockOnClick}>
                Click Me
            </LoadingButton>
        );

        const button = screen.getByRole('button', { name: /click me/i });
        fireEvent.click(button);

        // onClick should be called
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('renders with custom type attribute', () => {
        render(
            <LoadingButton type="submit" onClick={mockOnClick}>
                Submit
            </LoadingButton>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
    });
});