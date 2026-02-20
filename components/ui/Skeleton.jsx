import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={['animate-pulse rounded-xl bg-gray-100', className].filter(Boolean).join(' ')} />
);

const SkeletonRow = ({ columns = 6 }) => (
  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
    {Array.from({ length: columns }).map((_, index) => (
      <Skeleton key={index} className="h-3" />
    ))}
  </div>
);

export { Skeleton, SkeletonRow };
