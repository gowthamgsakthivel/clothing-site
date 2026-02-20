import React from 'react';

const DrawerHeader = ({ title, onClose }) => (
  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <button
      onClick={onClose}
      className="text-gray-500 hover:text-gray-700 transition-all duration-200"
    >
      Close
    </button>
  </div>
);

const DrawerBody = ({ children }) => (
  <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-160px)]">{children}</div>
);

const DrawerFooter = ({ children }) => (
  <div className="border-t border-gray-200 px-6 py-4">{children}</div>
);

export { DrawerHeader, DrawerBody, DrawerFooter };
