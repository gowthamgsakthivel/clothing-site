import React from 'react';

const ModalHeader = ({ title, description, onClose }) => (
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
);

const ModalBody = ({ children }) => (
  <div className="px-6 py-4">{children}</div>
);

const ModalFooter = ({ children }) => (
  <div className="border-t border-gray-200 px-6 py-4">{children}</div>
);

export { ModalHeader, ModalBody, ModalFooter };
