import React from 'react';

const statusPalette = {
  order: {
    placed: 'bg-blue-100 text-blue-800',
    packed: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-violet-100 text-violet-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    rto: 'bg-orange-100 text-orange-800',
    failed: 'bg-rose-100 text-rose-800',
    cancelled: 'bg-rose-100 text-rose-800'
  },
  shipment: {
    delivered: 'bg-emerald-100 text-emerald-800',
    rto: 'bg-rose-100 text-rose-800',
    failed: 'bg-rose-100 text-rose-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    unknown: 'bg-gray-100 text-gray-700'
  }
};

const StatusBadge = ({ type = 'order', value, className = '' }) => {
  if (!value) {
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">--</span>;
  }

  const normalized = value.toString().toLowerCase();
  const palette = statusPalette[type] || statusPalette.order;
  const classes = palette[normalized] || palette.unknown || 'bg-gray-100 text-gray-700';
  const label = normalized.replace(/_/g, ' ');

  return (
    <span className={['px-2 py-1 rounded-full text-xs font-medium transition-all duration-200', classes, className].filter(Boolean).join(' ')}>
      {label}
    </span>
  );
};

export default StatusBadge;
