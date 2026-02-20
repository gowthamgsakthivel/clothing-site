import React from 'react';

const Table = ({ children, compact = false, stickyHeader = false, className = '' }) => {
  const classes = ['min-w-full', className].filter(Boolean).join(' ');
  const cellPadding = compact ? 'px-4 py-2' : 'px-4 py-3';

  return (
    <div className="overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className={classes}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          if (child.type === 'thead') {
            return React.cloneElement(child, {
              className: ['text-left text-xs uppercase tracking-wide text-gray-500 border-b bg-gray-50', stickyHeader ? 'sticky top-0 z-10' : '', child.props.className]
                .filter(Boolean)
                .join(' '),
              cellPadding
            });
          }
          return React.cloneElement(child, { cellPadding });
        })}
      </table>
    </div>
  );
};

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

export { Table, THead, TBody, TR, TH, TD };
