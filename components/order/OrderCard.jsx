'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package, Truck, CheckCircle2, Clock, XCircle,
  Copy, Check, ChevronDown, ChevronUp, MapPin,
  ExternalLink, Sparkles, ArrowRight, RotateCcw, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { getDisplayOrderCode, getDisplayProductCode } from '@/lib/codeGenerators';

const STATUS_CONFIG = {
  placed: { label: 'Order Placed', color: 'bg-blue-50 text-blue-700 border-blue-200', step: 0, icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200', step: 0, icon: Clock },
  packed: { label: 'Packed & Ready', color: 'bg-amber-50 text-amber-700 border-amber-200', step: 1, icon: Package },
  shipped: { label: 'In Transit', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', step: 2, icon: Truck },
  'in transit': { label: 'In Transit', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', step: 2, icon: Truck },
  'out for delivery': { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-700 border-orange-200', step: 2, icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', step: 3, icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', step: 3, icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200', step: -1, icon: XCircle },
  failed: { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-200', step: -1, icon: XCircle },
  rto: { label: 'Returned to Origin', color: 'bg-rose-50 text-rose-700 border-rose-200', step: -1, icon: RotateCcw },
  rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200', step: -1, icon: XCircle }
};

const OrderCard = ({ order, currency = '₹' }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = useMemo(() => {
    if (!order?.date && !order?.createdAt) return 'Recent';
    const dateValue = typeof order.date === 'number' || /^\d+$/.test(order.date)
      ? new Date(Number(order.date) * 1000)
      : new Date(order.date || order.createdAt);
    return Number.isNaN(dateValue.getTime())
      ? 'Recent'
      : dateValue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [order?.date, order?.createdAt]);

  const orderCode = getDisplayOrderCode(order);
  const totalAmount = Number(order?.amount || order?.totalAmount || 0).toFixed(2);
  const rawStatus = (order?.shipment_status || order?.status || 'placed').toLowerCase();
  const statusInfo = STATUS_CONFIG[rawStatus] || {
    label: order?.status || 'Processing',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    step: 0,
    icon: Clock
  };

  const isCancelled = statusInfo.step === -1;
  const isDelivered = statusInfo.step === 3;
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timelineSteps = [
    { label: 'Order Placed', desc: 'Confirmed' },
    { label: 'Packed', desc: 'Quality Check' },
    { label: 'In Transit', desc: order?.courier_name || 'Courier' },
    { label: 'Delivered', desc: 'Destination' }
  ];

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 overflow-hidden">
      
      {/* 1. Header Bar */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 shrink-0">
            <Package className="w-5 h-5 text-orange-600" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-slate-900 tracking-wide">
                #{orderCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
                title="Copy Order ID"
                aria-label="Copy Order ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on <span className="font-semibold text-slate-700">{formattedDate}</span>
            </p>
          </div>
        </div>

        {/* Right Status Pill & Price */}
        <div className="flex items-center gap-4 ml-auto">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color} shadow-2xs`}>
            <statusInfo.icon className="w-3.5 h-3.5" />
            <span>{statusInfo.label}</span>
          </span>

          <div className="text-right pl-3 border-l border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {currency}{totalAmount}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Progress Tracker (If Active) */}
      {!isCancelled && (
        <div className="px-5 sm:px-8 py-5 border-b border-slate-100 bg-white">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute top-3.5 left-6 right-6 h-1 bg-slate-100 -z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{
                  width: `${(statusInfo.step / (timelineSteps.length - 1)) * 100}%`
                }}
              />
            </div>

            {timelineSteps.map((step, idx) => {
              const isPassed = idx <= statusInfo.step;
              const isCurrent = idx === statusInfo.step;

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCurrent
                        ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-md shadow-orange-600/20'
                        : isPassed
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-orange-600' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5 max-w-[80px] truncate">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Courier & AWB Tracker Badge if in-transit */}
          {order?.awb_code && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                <span>Courier: <strong className="font-semibold text-slate-800">{order.courier_name || 'Standard Express'}</strong></span>
                <span className="text-slate-300">•</span>
                <span>AWB: <strong className="font-mono text-slate-800">{order.awb_code}</strong></span>
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold hover:underline"
                >
                  <span>Live Tracking Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2B. Cancellation Banner (If Cancelled) */}
      {isCancelled && (
        <div className="px-5 sm:px-6 py-4 bg-rose-50/80 border-b border-rose-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-rose-900">
              Order Cancelled {order?.cancelledAt && `• ${new Date(order.cancelledAt).toLocaleDateString('en-IN')}`}
            </p>
            <p className="text-xs text-rose-700 leading-relaxed">
              <strong>Reason:</strong> {order?.cancellationReason || 'Quality check / requested by customer'}
            </p>
            {order?.paymentStatus === 'paid' && (
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Full refund of {currency}{totalAmount} initiated to original payment method.</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. Items List Showcase */}
      <div className="p-5 sm:p-6 space-y-4">
        {items.slice(0, isExpanded ? items.length : 2).map((item, idx) => {
          const isCustom = Boolean(item.isCustomDesign);
          const imgSrc = isCustom
            ? (item.customDesignImage || '/logo.svg')
            : (item.product?.image?.[0] || item.image?.[0] || '/logo.svg');
          const title = isCustom
            ? (item.designName || 'Custom Team Jersey')
            : (item.product?.name || item.name || 'Athletic Wear');
          const prodCode = isCustom ? null : getDisplayProductCode(item.product);

          return (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200"
            >
              {/* Product Thumbnail */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                <Image
                  src={imgSrc}
                  alt={title}
                  fill
                  sizes="80px"
                  className="object-contain mix-blend-multiply"
                />
                {isCustom && (
                  <span className="absolute bottom-1 right-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-2xs">
                    Custom
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {title}
                  </p>
                  <p className="text-sm font-black text-slate-900 shrink-0">
                    {currency}{Number(item.price || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {item.size && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700">
                      Size: {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                      Color: {item.color}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500">
                    Qty: {item.quantity || 1}
                  </span>
                </div>

                {prodCode && (
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Code: {prodCode}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Expand / Collapse for Multi-item Orders */}
        {items.length > 2 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 text-xs font-bold text-slate-600 hover:text-orange-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Show Less Items</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>View {items.length - 2} More Items ({itemCount} total)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Footer Actions & Shipping Destination */}
      <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Shipping Address Snippet */}
        <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">
            Deliver to: <strong className="font-semibold text-slate-800">{order?.address?.fullName || 'Customer'}</strong>
            {order?.address?.city ? `, ${order.address.city}` : ''}
            {order?.address?.pincode ? ` (${order.address.pincode})` : ''}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {!isCancelled && (
            <Link
              href={`/order-placed?orderId=${order?._id}#tracking`}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs shadow-sm shadow-orange-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <span>Track Order</span>
              <Truck className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            href={`/order-placed?orderId=${order?._id}`}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs shadow-2xs hover:bg-slate-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <span>Invoice & Details</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
