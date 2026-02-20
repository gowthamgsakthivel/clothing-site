import React from 'react';

const PaymentMethodSelection = ({ onPaymentMethodSelect = () => {}, selectedMethod = '' }) => {
    return (
        <div>
            <button
                type="button"
                onClick={() => onPaymentMethodSelect('Online')}
            >
                Online{selectedMethod === 'Online' ? ' (Selected)' : ''}
            </button>
        </div>
    );
};

export default PaymentMethodSelection;
