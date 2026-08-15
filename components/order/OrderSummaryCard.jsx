import Link from 'next/link'
import ShipmentStatusBadge from './ShipmentStatusBadge'
import { getDisplayOrderCode } from '@/lib/codeGenerators'

const OrderSummaryCard = ({
  orderId,
  orderCode,
  orderDate,
  paymentStatus,
  shipmentStatus,
  estimatedDelivery,
  onTrackOrder,
  trackHref
}) => {
  const displayOrderCode = getDisplayOrderCode({ orderCode, _id: orderId })

  const getPaymentBadgeClasses = (status) => {
    const normalized = (status || '').toLowerCase()
    if (['paid', 'completed', 'confirmed'].includes(normalized)) return 'bg-green-100 text-green-700 border-green-200'
    if (['failed', 'cancelled'].includes(normalized)) return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }

  const isCancelled = ['cancelled', 'rejected', 'failed', 'rto'].includes((shipmentStatus || paymentStatus || '').toLowerCase())

  return (
    <div className={`rounded-3xl bg-white p-6 border ${isCancelled ? 'border-rose-200' : 'border-orange-100'} shadow-sm`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-2xl ${isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'} flex items-center justify-center shrink-0`}>
            {isCancelled ? (
              <span className="text-xl font-black">✕</span>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isCancelled ? 'Order Cancelled' : 'Order Details'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isCancelled ? 'This order was cancelled. Shipment is voided.' : 'Tracking details are available below.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-700">
                <span className="font-semibold text-gray-900">Order ID:</span> {displayOrderCode}
              </span>
              <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-700">
                <span className="font-semibold text-gray-900">Order Date:</span> {orderDate}
              </span>
              <span className={`rounded-full border px-3 py-1 ${getPaymentBadgeClasses(paymentStatus)}`}>
                {paymentStatus}
              </span>
              <ShipmentStatusBadge status={shipmentStatus || 'Processing'} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {isCancelled ? (
            <Link
              href="/my-orders"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Back to My Orders
            </Link>
          ) : (
            <>
              {trackHref ? (
                <Link
                  href={trackHref}
                  className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                  aria-label="Track your order"
                >
                  Track Order
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onTrackOrder}
                  className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                  aria-label="Track your order"
                >
                  Track Order
                </button>
              )}
              <div className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
                ETA: <span className="text-gray-900">{estimatedDelivery || 'Pending update'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderSummaryCard
