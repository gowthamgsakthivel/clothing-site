import React from 'react';

const LoadingButton = ({
    isLoading,
    onClick,
    children,
    className = '',
    loadingText = 'Loading...',
    type = 'button',
    disabled = false,
    ...props
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`relative ${isLoading || disabled ? 'cursor-not-allowed opacity-80' : ''} ${className}`}
            {...props}
        >
            {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </span>
            )}
            <span className={isLoading ? 'invisible' : ''}>
                {isLoading ? loadingText : children}
            </span>
        </button>
    );
};

export default LoadingButton;