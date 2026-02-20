import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  const classes = ['rounded-2xl bg-white shadow-sm border border-gray-200', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={['px-6 pt-5', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={['px-6 pb-5', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={['px-6 pb-5 pt-2', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardBody, CardFooter };
