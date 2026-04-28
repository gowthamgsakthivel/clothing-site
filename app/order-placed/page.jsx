'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import SEOMetadata from '@/components/SEOMetadata'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OrderSummaryCard from '@/components/order/OrderSummaryCard'
import OrderTimeline from '@/components/order/OrderTimeline'
import TrackingEventCard from '@/components/order/TrackingEventCard'
import ShipmentStatusBadge from '@/components/order/ShipmentStatusBadge'

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

const OrderPlaced = () => {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState('')

  useEffect(() => {
    const orderId = searchParams.get('orderId')

    const buildStatusTimeline = (status) => {
      const steps = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered']
      const statusMap = {
        'order placed': 0,
        'processing': 0,
        'packed': 0,
        'shipped': 1,
        'in transit': 1,
        'out for delivery': 2,
        'delivered': 3,
        'completed': 3,
        'cancelled': -1,
        'failed': -1,
        'rejected': -1,
        'rto': -1
      }

      const current = statusMap[(status || '').toLowerCase()] ?? 0
      return { steps, current }
    }

    const formatOrderDate = (unixSeconds) => {
      if (!unixSeconds) return ''
      const dateObj = new Date(unixSeconds * 1000)
      return dateObj.toLocaleString()
    }

    const normalizeOrder = (rawOrder) => {
      const items = (rawOrder.items || []).map((item, index) => {
        const isCustomDesign = Boolean(item.isCustomDesign)
        const product = item.product && typeof item.product === 'object' ? item.product : null
        const image = isCustomDesign
          ? (item.customDesignImage || '/placeholder.png')
          : (product?.image?.[0] || '/placeholder.png')

        return {
          id: item._id || `${rawOrder._id}-${index}`,
          name: isCustomDesign ? (item.designName || 'Custom Design') : (product?.name || 'Product'),
          image,
          size: item.size || 'N/A',
          color: item.color || 'N/A',
          quantity: item.quantity,
          price: item.price
        }
      })

      const address = rawOrder.address || {}
      const pricing = {
        subtotal: rawOrder.amount || 0,
        shipping: 0,
        discount: 0,
        total: rawOrder.amount || 0
      }

      return {
        id: rawOrder._id,
        orderStatus: rawOrder.status || 'Processing',
        date: formatOrderDate(rawOrder.date),
        paymentStatus: rawOrder.paymentStatus || 'Pending',
        paymentMethod: rawOrder.paymentMethod || 'COD',
        shipmentStatus: rawOrder.shipment_status || 'Processing',
        awbCode: rawOrder.awb_code || null,
        trackingUrl: rawOrder.tracking_url || null,
        courierName: rawOrder.courier_name || null,
        items,
        address: {
          name: address.fullName || 'Customer',
          line1: address.area || 'Address',
          line2: '',
          city: address.city || '',
          state: address.state || '',
          zip: address.pincode || '',
          phone: address.phoneNumber || ''
        },
        deliveryMethod: rawOrder.courier_name || 'Standard Shipping',
        estimatedDelivery: rawOrder.shipment_status || 'Processing',
        transactionId: rawOrder.paymentDetails?.paymentId || null,
        statusTimeline: buildStatusTimeline(rawOrder.status),
        pricing
      }
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/orders/list', { cache: 'no-store' })
        const data = await response.json()

        if (!data?.success || !Array.isArray(data.orders)) {
          setOrder(null)
          return
        }

        const selectedOrder = orderId
          ? data.orders.find(orderItem => orderItem._id === orderId)
          : data.orders[0]

        setOrder(selectedOrder ? normalizeOrder(selectedOrder) : null)
      } catch (error) {
        console.error('Failed to load order details:', error)
        setOrder(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [searchParams])

  const trackingEvents = useMemo(() => {
    const events = tracking?.tracking_data?.shipment_track_activities || []
    if (!Array.isArray(events)) return []
    return [...events].sort((a, b) => {
      const dateA = new Date(a?.date || a?.event_date || 0).getTime()
      const dateB = new Date(b?.date || b?.event_date || 0).getTime()
      return dateB - dateA
    })
  }, [tracking])

  useEffect(() => {
    const fetchTracking = async () => {
      if (!order?.id) return
      setTrackingLoading(true)
      setTrackingError('')
      try {
        const response = await fetch(`/api/shipping/track?orderId=${order.id}`, { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Tracking updates are not available yet.')
        }
        setTracking(data.tracking)
      } catch (error) {
        setTracking(null)
        setTrackingError(error.message || 'Unable to load tracking details')
      } finally {
        setTrackingLoading(false)
      }
    }

    fetchTracking()
  }, [order?.id])

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
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-gray-800">No order details found</p>
          <p className="text-sm text-gray-500 mt-1">Please check your orders list or try again.</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/my-orders"
              className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
              aria-label="Go to my orders"
            >
              Go to My Orders
            </Link>
            <Link
              href="/all-products"
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 pt-20 md:pt-24 pb-28 md:pb-16">
        <SEOMetadata
          title="Order Confirmed | Sparrow Sports"
          description="Your order has been confirmed. Thank you for shopping with Sparrow Sports!"
          keywords="order confirmed, order summary, purchase successful"
          url="/order-placed"
          noindex={true}
        />

        <div className="px-4 sm:px-6 md:px-16 lg:px-32 space-y-6">
          <OrderSummaryCard
            orderId={order.id}
            orderDate={order.date}
            paymentStatus={order.paymentStatus}
            shipmentStatus={order.shipmentStatus}
            estimatedDelivery={order.estimatedDelivery}
            trackHref={`/order-placed?orderId=${order.id}#tracking`}
          />

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
                  <OrderTimeline
                    steps={order.statusTimeline.steps}
                    current={order.statusTimeline.current}
                    status={order.orderStatus}
                  />
                </div>
              </div>

              <div id="tracking" className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Shipment Tracking</h2>
                    <p className="text-sm text-gray-500 mt-1">Live updates from Shiprocket.</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!order?.id) return
                      setTrackingLoading(true)
                      setTrackingError('')
                      try {
                        const response = await fetch(`/api/shipping/track?orderId=${order.id}`, { cache: 'no-store' })
                        const data = await response.json()
                        if (!response.ok || !data.success) {
                          throw new Error(data.message || 'Tracking updates are not available yet.')
                        }
                        setTracking(data.tracking)
                      } catch (error) {
                        setTracking(null)
                        setTrackingError(error.message || 'Unable to load tracking details')
                      } finally {
                        setTrackingLoading(false)
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    aria-label="Refresh tracking status"
                  >
                    {trackingLoading ? 'Refreshing…' : 'Refresh Status'}
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Courier</p>
                    <p className="font-semibold text-gray-900 mt-1">{order.courierName || 'Assigning Courier'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shipment Status</p>
                    <div className="mt-1">
                      <ShipmentStatusBadge status={order.shipmentStatus || 'Processing'} />
                    </div>
                  </div>
                  {order.awbCode && (
                    <div>
                      <p className="text-xs text-gray-500">AWB</p>
                      <p className="font-semibold text-gray-900 mt-1">{order.awbCode}</p>
                    </div>
                  )}
                  {order.trackingUrl && (
                    <div>
                      <p className="text-xs text-gray-500">Tracking Link</p>
                      <a className="font-semibold text-orange-600 mt-1 inline-block" href={order.trackingUrl} target="_blank" rel="noreferrer">
                        Open Tracking
                      </a>
                    </div>
                  )}
                </div>
                {trackingLoading && (
                  <div className="mt-4 space-y-3 animate-pulse">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="h-16 rounded-xl bg-gray-100" />
                    ))}
                  </div>
                )}

                {!trackingLoading && trackingError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {trackingError}
                  </div>
                )}

                {!trackingLoading && !trackingError && trackingEvents.length === 0 && (
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                    Tracking updates will appear once the courier scans the shipment.
                  </div>
                )}

                {!trackingLoading && !trackingError && trackingEvents.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {trackingEvents.map((event, index) => (
                      <TrackingEventCard key={`${event?.date || event?.event_date || 'event'}-${index}`} event={event} />
                    ))}
                  </div>
                )}
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
                  <Link
                    href={`/order-placed?orderId=${order.id}#tracking`}
                    className="w-full rounded-lg bg-orange-600 text-white py-3 font-semibold hover:bg-orange-700 transition text-center"
                    aria-label="Open tracking"
                  >
                    Track Order
                  </Link>
                  <Link
                    href="/all-products"
                    className="w-full rounded-lg border border-gray-300 text-gray-700 py-3 font-semibold hover:bg-gray-50 transition text-center"
                  >
                    Continue Shopping
                  </Link>
                  <button className="w-full rounded-lg border border-gray-300 text-gray-700 py-3 font-semibold hover:bg-gray-50 transition">
                    Download Invoice
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Why shop with us</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">✓</span>
                    Secure payments with Razorpay
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">⚡</span>
                    Fast delivery with Shiprocket partners
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">↺</span>
                    Easy returns within 7 days
                  </div>
                  <div className="text-xs text-gray-500 pt-2">
                    Need help? Email support@sparrowsports.com • Call +91 90000 00000
                  </div>
                  <Link href="/returns" className="text-xs text-orange-600 font-semibold">
                    Shipping & Return Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky mobile actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/all-products"
              className="w-full rounded-lg border border-gray-300 text-gray-700 py-3 text-sm font-semibold text-center"
            >
              Continue Shopping
            </Link>
            <Link
              href={`/order-placed?orderId=${order.id}#tracking`}
              className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold text-center"
              aria-label="Track your order"
            >
              Track Order
            </Link>
          </div>
          <button className="mt-3 w-full rounded-lg border border-gray-300 text-gray-700 py-2 text-sm font-semibold">
            Download Invoice
          </button>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default OrderPlaced