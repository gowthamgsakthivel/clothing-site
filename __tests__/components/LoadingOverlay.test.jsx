/**
 * Component Tests for LoadingOverlay (components/LoadingOverlay.jsx)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from '@/components/LoadingOverlay';

describe('LoadingOverlay Component', () => {
    test('renders children directly without overlay when not loading', () => {
        render(
            <LoadingOverlay isLoading={false}>
                <div data-testid="test-content">Main Content</div>
            </LoadingOverlay>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    test('renders spinner and message when loading', () => {
        render(
            <LoadingOverlay isLoading={true} message="Fetching Data...">
                <div data-testid="test-content">Main Content</div>
            </LoadingOverlay>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByText('Fetching Data...')).toBeInTheDocument();
    });

    test('applies fixed class when fullPage prop is true', () => {
        render(
            <LoadingOverlay isLoading={true} fullPage={true}>
                <div>Content</div>
            </LoadingOverlay>
        );

        const overlay = screen.getByText('Loading...').closest('.fixed, .absolute');
        expect(overlay).toHaveClass('fixed');
    });
});
