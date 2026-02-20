const OrderStatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase()

  let classes = 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (['processing'].includes(normalized)) {
    classes = 'bg-blue-100 text-blue-700 border-blue-200'
  } else if (['shipped', 'in transit'].includes(normalized)) {
    classes = 'bg-indigo-100 text-indigo-700 border-indigo-200'
  } else if (['out for delivery'].includes(normalized)) {
    classes = 'bg-orange-100 text-orange-700 border-orange-200'
  } else if (['delivered', 'completed'].includes(normalized)) {
    classes = 'bg-green-100 text-green-700 border-green-200'
  } else if (['failed', 'rto', 'cancelled', 'rejected'].includes(normalized)) {
    classes = 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {status || 'Pending'}
    </span>
  )
}

export default OrderStatusBadge
