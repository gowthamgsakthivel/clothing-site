import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from '@/components/LoadingOverlay';

describe('LoadingOverlay', () => {
    test('renders children without overlay when not loading', () => {
        render(
            <LoadingOverlay isLoading={false}>
                <div data-testid="content">Content</div>
            </LoadingOverlay>
        );

        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    test('renders children with overlay when loading', () => {
        render(
            <LoadingOverlay isLoading={true}>
                <div data-testid="content">Content</div>
            </LoadingOverlay>
        );

        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // Check for spinner
        const spinner = document.querySelector('svg.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    test('applies fullPage class when fullPage prop is true', () => {
        render(
            <LoadingOverlay isLoading={true} fullPage={true}>
                <div data-testid="content">Content</div>
            </LoadingOverlay>
        );

        const overlay = screen.getByText('Loading...').closest('div.absolute');
        expect(overlay).toHaveClass('fixed');
    });

    test('does not apply fullPage class when fullPage prop is false', () => {
        render(
            <LoadingOverlay isLoading={true} fullPage={false}>
                <div data-testid="content">Content</div>
            </LoadingOverlay>
        );

        const overlay = screen.getByText('Loading...').closest('div.absolute');
        expect(overlay).not.toHaveClass('fixed');
    });
});