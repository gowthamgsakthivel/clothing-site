import React from 'react';

const Modal = ({ open, title, description, children, onClose, footer, className = '' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={['w-full max-w-2xl rounded-2xl bg-white shadow-md border border-gray-200', className].filter(Boolean).join(' ')}>
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-all duration-200"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
