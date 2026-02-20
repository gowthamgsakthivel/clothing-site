import React from 'react';

const Drawer = ({ open, title, children, onClose, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-md h-full bg-white shadow-md border-l border-gray-200 transition-all duration-300 ease-out">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-all duration-200"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-160px)]">{children}</div>
        {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Drawer;
