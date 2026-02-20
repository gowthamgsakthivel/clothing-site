import React from 'react';

const THead = ({ children, className = '', cellPadding }) => (
  <thead className={className}>
    {React.Children.map(children, (child) => React.cloneElement(child, { cellPadding }))}
  </thead>
);

const TBody = ({ children, className = '', cellPadding }) => (
  <tbody className={className}>
    {React.Children.map(children, (child) => React.cloneElement(child, { cellPadding }))}
  </tbody>
);

const TR = ({ children, className = '', cellPadding }) => (
  <tr className={['border-b last:border-b-0 hover:bg-gray-50 transition-all duration-200', className].filter(Boolean).join(' ')}>
    {React.Children.map(children, (child) => React.cloneElement(child, { cellPadding }))}
  </tr>
);

const TH = ({ children, className = '', cellPadding }) => (
  <th className={[cellPadding || 'px-4 py-3', className].filter(Boolean).join(' ')}>{children}</th>
);

const TD = ({ children, className = '', cellPadding }) => (
  <td className={[cellPadding || 'px-4 py-3', className].filter(Boolean).join(' ')}>{children}</td>
);

export { THead, TBody, TR, TH, TD };
