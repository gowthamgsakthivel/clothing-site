const ShipmentStatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase()

  let classes = 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (['delivered', 'completed'].includes(normalized)) {
    classes = 'bg-green-100 text-green-700 border-green-200'
  } else if (['shipped', 'in transit', 'out for delivery'].includes(normalized)) {
    classes = 'bg-blue-100 text-blue-700 border-blue-200'
  } else if (['failed', 'rto', 'cancelled'].includes(normalized)) {
    classes = 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {status || 'Processing'}
    </span>
  )
}

export default ShipmentStatusBadge
