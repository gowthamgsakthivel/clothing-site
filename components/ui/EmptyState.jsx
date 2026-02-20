import React from 'react';

const EmptyState = ({ title = 'Nothing here yet', description, action }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
