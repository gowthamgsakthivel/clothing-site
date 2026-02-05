'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Loading from '@/components/Loading'
import SEOMetadata from '@/components/SEOMetadata'
import { useAppContext } from '@/context/AppContext'
import { formatDistance } from 'date-fns'
import axios from 'axios'

const STATUS_STEPS = [
    'Order Placed',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered'
]

const normalizeStatus = (status) => (status || '').toLowerCase()

const getStatusIndex = (status) => {
    const normalized = normalizeStatus(status)

    if (['delivered', 'completed'].includes(normalized)) return 5
    if (['out for delivery'].includes(normalized)) return 4
    if (['shipped', 'in transit'].includes(normalized)) return 3
    if (['packed', 'processing'].includes(normalized)) return 2
    if (['confirmed', 'order confirmed'].includes(normalized)) return 1
    if (['order placed', 'placed'].includes(normalized)) return 0
    return 0
}

const getStatusBadgeTone = (status) => {
    const normalized = normalizeStatus(status)
    if (['cancelled', 'failed', 'rejected'].includes(normalized)) return 'bg-red-100 text-red-700 border-red-200'
    if (['delivered', 'completed'].includes(normalized)) return 'bg-green-100 text-green-700 border-green-200'
    return 'bg-orange-100 text-orange-700 border-orange-200'
}

const formatOrderDate = (timestamp) => {
    if (!timestamp) return { formatted: 'N/A', relative: '' }

    let date
    if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
        date = new Date(parseInt(timestamp) * 1000)
    } else {
        date = new Date(timestamp)
    }

    if (isNaN(date.getTime())) return { formatted: 'N/A', relative: '' }

    return {
        formatted: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        relative: formatDistance(date, new Date(), { addSuffix: true })
    }
}

const OrderDetailsPage = () => {
    const { currency } = useAppContext()
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('id')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [order, setOrder] = useState(null)

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setError('Order not found')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const { data } = await axios.get('/api/order/list', {
                    withCredentials: true,
                    headers: { 'Content-Type': 'application/json' }
                })

                if (data.success && Array.isArray(data.orders)) {
                    const matched = data.orders.find((item) => item._id === orderId)
                    if (!matched) {
                        setError('Order not found')
                    } else {
                        setOrder(matched)
                    }
                } else {
                    setError(data.message || 'Failed to load order')
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    setError('Please sign in to view this order')
                } else {
                    setError('Unable to fetch order details')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [orderId])

    const dateInfo = useMemo(() => formatOrderDate(order?.date || order?.createdAt), [order])
    const statusIndex = useMemo(() => getStatusIndex(order?.status), [order])
    const isCancelled = ['cancelled', 'failed', 'rejected'].includes(normalizeStatus(order?.status))

    const items = Array.isArray(order?.items) ? order.items : []
    const subtotal = items.reduce((sum, item) => {
        const price = item.price || item.product?.offerPrice || item.product?.price || 0
        return sum + price * (item.quantity || 1)
    }, 0)
    const totalPaid = order?.amount || subtotal
    const taxAmount = Math.max(0, totalPaid - subtotal)
    const deliveryCharge = 0

    const canTrack = ['shipped', 'in transit', 'out for delivery', 'delivered'].includes(normalizeStatus(order?.status))
    const canReturn = ['delivered', 'completed'].includes(normalizeStatus(order?.status))

    if (loading) {
        return (
            <div className="min-h-screen pt-20 md:pt-24 px-4 sm:px-6 md:px-16 lg:px-32">
                <Loading />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen pt-20 md:pt-24 px-4 sm:px-6 md:px-16 lg:px-32 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-lg font-semibold text-gray-800">{error}</p>
                    <p className="text-sm text-gray-500 mt-2">Please check your orders history.</p>
                    <button
                        onClick={() => router.push('/my-orders')}
                        className="mt-4 h-11 px-4 rounded-lg bg-orange-600 text-white text-sm font-semibold"
                    >
                        Back to My Orders
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <Navbar />
            <SEOMetadata
                title="Order Details | Sparrow Sports"
                description="View your order details, status timeline, and delivery information."
                keywords="order details, order status, delivery tracking"
                url="/order-details"
                noindex={true}
            />

            <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-24 overflow-x-hidden">
                <div className="px-4 sm:px-6 md:px-16 lg:px-32 space-y-6 max-w-5xl mx-auto">
                    <div className="rounded-2xl bg-white p-5 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Order ID</p>
                                <h1 className="text-xl font-bold text-gray-900 mt-1 break-all">{order._id}</h1>
                                <p className="text-sm text-gray-600 mt-2">
                                    {dateInfo.formatted} {dateInfo.relative && <span className="text-gray-400">({dateInfo.relative})</span>}
                                </p>
                            </div>
                            <span className={`self-start px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusBadgeTone(order.status)}`}>
                                {order.status || 'Order Placed'}
                            </span>
                        </div>
                        <p className="mt-4 text-xs text-gray-600">Manufactured after order confirmation</p>
                        <p className="text-xs text-gray-600">Quality checked before dispatch</p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                        <div className="mt-4 space-y-4">
                            {STATUS_STEPS.map((step, index) => {
                                const isComplete = !isCancelled && index <= statusIndex
                                return (
                                    <div key={step} className="flex items-start gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                {index + 1}
                                            </div>
                                            {index < STATUS_STEPS.length - 1 && (
                                                <div className={`w-px flex-1 ${isComplete ? 'bg-green-300' : 'bg-gray-200'} min-h-[24px]`} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {step}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                        <div className="mt-4 space-y-3">
                            {items.map((item, idx) => {
                                const imageUrl = item.customDesignImage || item.product?.image?.[0]
                                const itemName = item.designName || item.product?.name || 'Product'
                                const itemPrice = item.price || item.product?.offerPrice || item.product?.price || 0
                                return (
                                    <div key={idx} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                            {imageUrl ? (
                                                <Image src={imageUrl} alt={itemName} fill className="object-cover" sizes="64px" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[11px] text-gray-400">No image</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{itemName}</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {item.color ? `Color: ${item.color}` : 'Color: —'}
                                                {' • '}
                                                {item.size ? `Size: ${item.size}` : 'Size: —'}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">Qty: {item.quantity || 1}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{currency}{itemPrice}</p>
                                            <p className="text-xs text-gray-500 mt-1">per item</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Price Breakdown</h2>
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <span>Subtotal</span>
                                <span>{currency}{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Delivery</span>
                                <span>{deliveryCharge === 0 ? 'Free' : `${currency}${deliveryCharge.toFixed(2)}`}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tax</span>
                                <span>{currency}{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
                                <span>Total Paid</span>
                                <span>{currency}{totalPaid.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>
                        <div className="mt-4 text-sm text-gray-700 space-y-2">
                            <p className="font-semibold text-gray-900">{order.address?.fullName || order.address?.name || 'Customer'}</p>
                            <p>{order.address?.area || order.address?.line1 || 'Address pending'}</p>
                            {order.address?.line2 && <p>{order.address.line2}</p>}
                            <p>{order.address?.city || ''} {order.address?.state || ''} {order.address?.pincode || order.address?.zip || ''}</p>
                            <p>{order.address?.phoneNumber || order.address?.phone || ''}</p>
                            <div className="pt-3">
                                <p className="text-xs text-gray-500">Delivery Method</p>
                                <p className="font-semibold text-gray-900">{order.deliveryMethod || 'Standard'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
                        <div className="mt-4 grid grid-cols-1 gap-3">
                            <button
                                onClick={() => router.push(`/track-order?orderId=${order._id}`)}
                                disabled={!canTrack}
                                className={`h-11 rounded-lg font-semibold text-sm ${canTrack ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                Track Order
                            </button>
                            <button
                                disabled
                                className="h-11 rounded-lg border border-gray-300 text-gray-400 text-sm font-semibold cursor-not-allowed"
                            >
                                Download Invoice
                            </button>
                            <button
                                disabled={!canReturn}
                                className={`h-11 rounded-lg border text-sm font-semibold ${canReturn ? 'border-orange-600 text-orange-600' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}
                            >
                                Request Return / Replacement
                            </button>
                            <button
                                onClick={() => router.push('/contact')}
                                className="h-11 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    )
}

export default OrderDetailsPage