'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import SEOMetadata from '@/components/SEOMetadata'

const OrderItem = ({ item }) => {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              Size: {item.size} • Color: {item.color}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900">₹{item.price}</p>
        </div>
        <p className="mt-2 text-xs text-gray-600">Qty: {item.quantity}</p>
      </div>
    </div>
  )
}

const PriceSummary = ({ pricing }) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>Subtotal</span>
        <span>₹{pricing.subtotal}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>Shipping</span>
        <span>{pricing.shipping === 0 ? 'Free' : `₹${pricing.shipping}`}</span>
      </div>
      {pricing.discount > 0 && (
        <div className="flex items-center justify-between text-sm text-green-700">
          <span>Discount</span>
          <span>-₹{pricing.discount}</span>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
        <span>Total Paid</span>
        <span>₹{pricing.total}</span>
      </div>
    </div>
  )
}

const StatusTimeline = ({ steps, current }) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {steps.map((step, index) => {
          const isComplete = index <= current
          return (
            <div key={step} className="flex md:flex-col items-center md:items-start gap-3 md:gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {index + 1}
              </div>
              <div className="flex-1 w-full">
                <p className={`text-xs md:text-sm font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step}
                </p>
                <div className="mt-2 hidden md:block h-1 w-full rounded-full bg-gray-100">
                  <div className={`h-1 rounded-full ${isComplete ? 'bg-green-600' : 'bg-gray-200'}`} style={{ width: isComplete ? '100%' : '0%' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const OrderPlaced = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    setOrder(null)
  }, [])

  const itemCount = useMemo(() => (order?.items || []).reduce((sum, item) => sum + item.quantity, 0), [order])

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 px-4 sm:px-6 md:px-16 lg:px-32">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-40 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 px-4 sm:px-6 md:px-16 lg:px-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">Order details will appear here</p>
          <p className="text-sm text-gray-500 mt-1">We’ll show live status after Shiprocket integration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-28 md:pb-16">
      <SEOMetadata
        title="Order Confirmed | Sparrow Sports"
        description="Your order has been confirmed. Thank you for shopping with Sparrow Sports!"
        keywords="order confirmed, order summary, purchase successful"
        url="/order-placed"
        noindex={true}
      />

      <div className="px-4 sm:px-6 md:px-16 lg:px-32 space-y-6">
        {/* Order Success Header */}
        <div className="rounded-2xl bg-white p-6 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Confirmed!</h1>
              <p className="text-sm text-gray-600 mt-1">Thank you for your purchase. Your order is being prepared.</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                <span><span className="font-semibold text-gray-900">Order ID:</span> {order.id}</span>
                <span><span className="font-semibold text-gray-900">Order Date:</span> {order.date}</span>
                <span><span className="font-semibold text-gray-900">Payment:</span> {order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                <span className="text-xs text-gray-500">{itemCount} items</span>
              </div>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <OrderItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Delivery Information</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Shipping Address</p>
                  <p className="font-semibold text-gray-900 mt-1">{order.address.name}</p>
                  <p>{order.address.line1}</p>
                  <p>{order.address.line2}</p>
                  <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                  <p className="mt-1">{order.address.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delivery Method</p>
                  <p className="font-semibold text-gray-900 mt-1">{order.deliveryMethod}</p>
                  <p className="text-xs text-gray-500 mt-3">Estimated Delivery</p>
                  <p className="font-semibold text-gray-900 mt-1">{order.estimatedDelivery}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="font-semibold text-gray-900 mt-1">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className="font-semibold text-green-600 mt-1">Successful</p>
                </div>
                {order.transactionId && (
                  <div>
                    <p className="text-xs text-gray-500">Transaction ID</p>
                    <p className="font-semibold text-gray-900 mt-1">{order.transactionId}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              <div className="mt-4">
                <StatusTimeline steps={order.statusTimeline.steps} current={order.statusTimeline.current} />
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Price Summary</h2>
              <div className="mt-4">
                <PriceSummary pricing={order.pricing} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 hidden md:block">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              <div className="mt-4 flex flex-col gap-3">
                <button className="w-full rounded-lg bg-orange-600 text-white py-3 font-semibold hover:bg-orange-700 transition">
                  Track Order
                </button>
                <button className="w-full rounded-lg border border-gray-300 text-gray-700 py-3 font-semibold hover:bg-gray-50 transition">
                  Continue Shopping
                </button>
                <button className="w-full rounded-lg border border-gray-300 text-gray-700 py-3 font-semibold hover:bg-gray-50 transition">
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
        <div className="grid grid-cols-2 gap-3">
          <button className="w-full rounded-lg border border-gray-300 text-gray-700 py-3 text-sm font-semibold">
            Continue Shopping
          </button>
          <button className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold">
            Track Order
          </button>
        </div>
        <button className="mt-3 w-full rounded-lg border border-gray-300 text-gray-700 py-2 text-sm font-semibold">
          Download Invoice
        </button>
      </div>
    </div>
  )
}

export default OrderPlaced