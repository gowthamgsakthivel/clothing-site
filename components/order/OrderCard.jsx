import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import OrderStatusBadge from './OrderStatusBadge'
import OrderTimelineMini from './OrderTimelineMini'

const OrderCard = ({ order, currency }) => {

  const formattedDate = useMemo(() => {
    if (!order?.date) return 'N/A'
    const dateValue = typeof order.date === 'number' || /^\d+$/.test(order.date)
      ? new Date(Number(order.date) * 1000)
      : new Date(order.date)
    return Number.isNaN(dateValue.getTime()) ? 'N/A' : dateValue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }, [order?.date])

  const itemCount = Array.isArray(order?.items) ? order.items.length : 0
  const totalAmount = Number(order?.amount || 0).toFixed(2)
  const status = order?.shipment_status || order?.status || 'Pending'
  const estimatedDelivery = order?.estimated_delivery_date || order?.estimatedDelivery || 'Pending update'

  const statusMap = {
    'order placed': 0,
    'processing': 0,
    'packed': 0,
    'shipped': 1,
    'in transit': 1,
    'out for delivery': 2,
    'delivered': 3,
    'completed': 3
  }

  const timelineIndex = statusMap[(status || '').toLowerCase()] ?? 0

  const firstItem = Array.isArray(order?.items) ? order.items[0] : null
  const isCustomDesign = Boolean(firstItem?.isCustomDesign)
  const product = firstItem?.product && typeof firstItem.product === 'object' ? firstItem.product : null
  const itemImage = isCustomDesign
    ? (firstItem?.customDesignImage || '/placeholder.png')
    : (product?.image?.[0] || '/placeholder.png')
  const itemName = isCustomDesign
    ? (firstItem?.designName || 'Custom Design')
    : (product?.name || 'Product')

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">ORDER #</p>
              <p className="text-lg font-semibold text-gray-900">{order?._id?.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">ORDER TOTAL</p>
              <p className="text-xl font-semibold text-gray-900">{currency}{totalAmount}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={status} />
            <span className="text-xs text-gray-500">Items: {itemCount}</span>
            <span className="text-xs text-gray-500">ETA: {estimatedDelivery}</span>
          </div>

          <div className="pt-2">
            <OrderTimelineMini current={timelineIndex} />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white">
                <Image src={itemImage} alt={itemName} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{itemName}</p>
                <p className="text-xs text-gray-500 mt-1">Qty: {firstItem?.quantity || 1}</p>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {currency}{Number(firstItem?.price || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/order-placed?orderId=${order?._id}#tracking`}
              className="h-11 w-full sm:w-auto rounded-xl bg-orange-600 px-6 text-white text-sm font-semibold hover:bg-orange-700 transition flex items-center justify-center"
            >
              Track Order
            </Link>
            <Link
              href={`/order-placed?orderId=${order?._id}`}
              className="h-11 w-full sm:w-auto rounded-xl border border-orange-600 px-6 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition flex items-center justify-center"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderCard
