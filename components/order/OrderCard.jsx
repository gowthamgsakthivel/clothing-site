import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import OrderStatusBadge from './OrderStatusBadge'
import OrderTimelineMini from './OrderTimelineMini'
import { getDisplayOrderCode, getDisplayProductCode } from '@/lib/codeGenerators'

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
  const orderCode = getDisplayOrderCode(order)

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
  const productCode = isCustomDesign ? null : getDisplayProductCode(firstItem?.product || product)

  const isCancelled = ['cancelled', 'rejected', 'failed', 'rto'].includes((order?.status || order?.shipment_status || status || '').toLowerCase())

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">ORDER #</p>
              <p className="text-lg font-semibold text-gray-900">{orderCode}</p>
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
            {!isCancelled && (
              <span className="text-xs text-gray-500">ETA: {estimatedDelivery}</span>
            )}
          </div>

          {/* Cancellation Banner vs Active Timeline */}
          {isCancelled ? (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                <span>❌ Order Cancelled</span>
                {order?.cancelledAt && (
                  <span className="text-[11px] font-normal text-red-500">
                    • {new Date(order.cancelledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="text-xs text-red-900">
                <strong className="font-semibold text-red-950">Reason:</strong> {order?.cancellationReason || 'Item unavailable / Quality inspection'}
              </p>
              {order?.cancellationNotes && (
                <p className="text-[11px] text-red-700 italic">
                  &quot;{order.cancellationNotes}&quot;
                </p>
              )}
              {order?.paymentStatus === 'paid' && (
                <div className="pt-1.5 border-t border-red-200/60 text-xs text-emerald-800 font-semibold flex items-center gap-1">
                  <span>💰 Refund of {currency}{totalAmount} initiated to original payment method (3–5 business days).</span>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2">
              <OrderTimelineMini current={timelineIndex} />
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white">
                <Image src={itemImage} alt={itemName} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {itemName}
                  {(firstItem?.color || firstItem?.size) && (
                    <span className="text-gray-500 font-normal ml-1">
                      — {firstItem.color ? `${firstItem.color}` : ''} {firstItem.size ? `(${firstItem.size})` : ''}
                    </span>
                  )}
                </p>
                {productCode && (
                  <p className="text-[11px] text-gray-500 mt-0.5">Code: {productCode}</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">Qty: {firstItem?.quantity || 1}</p>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {currency}{Number(firstItem?.price || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {!isCancelled && (
              <Link
                href={`/order-placed?orderId=${order?._id}#tracking`}
                className="h-11 w-full sm:w-auto rounded-xl bg-orange-600 px-6 text-white text-sm font-semibold hover:bg-orange-700 transition flex items-center justify-center"
              >
                Track Order
              </Link>
            )}
            <Link
              href={`/order-placed?orderId=${order?._id}`}
              className={`h-11 w-full sm:w-auto rounded-xl ${isCancelled ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-orange-600 text-orange-600 hover:bg-orange-50'} px-6 text-sm font-semibold transition flex items-center justify-center`}
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
