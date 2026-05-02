'use client';

import React, { useEffect, useState, use } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import { StatusBadge } from '@/components/ui';
import { getDisplayOrderCode } from '@/lib/codeGenerators';

export default function OrderInvoicePage({ params }) {
    const unwrappedParams = use(params);
    const orderId = unwrappedParams.id;
    const { getToken, currency } = useAppContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadOrder() {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await axios.get(`/api/admin/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data?.success) {
                    setOrder(res.data.data.order);
                } else {
                    setError(res.data?.message || 'Failed to open invoice');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadOrder();
    }, [orderId, getToken]);

    // Once order loads, natively call print dialogue
    useEffect(() => {
        if (!loading && order) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [loading, order]);

    if (loading) return <div className="p-10 text-center font-semibold text-slate-500">Generating Invoice...</div>;
    if (error || !order) return <div className="p-10 text-center text-rose-500">{error || 'Invoice not found'}</div>;

    const address = order.shippingAddress || {};

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-[21cm] mx-auto bg-white p-8 md:p-12 print:p-0">

                {/* Header section */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">TAX INVOICE</h1>
                        <p className="text-slate-500 mt-1 uppercase tracking-widest text-sm font-bold">Original for Recipient</p>
                        <p className="text-slate-600 mt-1 text-sm font-semibold">GSTIN: 33XXXXXXXXXXZ1</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-900 tracking-widest uppercase">Sparrow Sports</h2>
                        <p className="text-sm text-slate-600 mt-2">123 Athletics Ave</p>
                        <p className="text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                        <p className="text-sm text-slate-600">contact@sparrowsports.com</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    {/* Bill To */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill / Ship To</h3>
                        <p className="text-base font-bold text-slate-900">{address.fullName || order.customerName || 'Customer'}</p>
                        <p className="text-sm text-slate-600 mt-1">{address.area}</p>
                        <p className="text-sm text-slate-600">{address.city}, {address.state} {address.pincode}</p>
                        <p className="text-sm text-slate-600 mt-2">Phone: {address.phoneNumber || '--'}</p>
                        <p className="text-sm text-slate-600">Email: {order.customerEmail || '--'}</p>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                            <p className="text-sm font-semibold text-slate-900">#{getDisplayOrderCode(order)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '--'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment</p>
                            <p className="text-sm font-semibold text-slate-900 capitalize">{order.paymentMethod} - {order.paymentStatus}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-12">
                    <table className="w-full text-left border-collapse border border-slate-300">
                        <thead className="bg-slate-50">
                            <tr className="border-b-2 border-slate-900 text-xs uppercase tracking-wider text-slate-700">
                                <th className="p-3 border-r border-slate-300 font-bold text-center w-12">S.No</th>
                                <th className="p-3 border-r border-slate-300 font-bold">Product Name</th>
                                <th className="p-3 border-r border-slate-300 font-bold text-center w-20">Qty</th>
                                <th className="p-3 border-r border-slate-300 font-bold text-right w-24">Unit Price</th>
                                <th className="p-3 border-r border-slate-300 font-bold text-right w-28">Net Amount</th>
                                <th className="p-3 border-r border-slate-300 font-bold text-right w-24">Tax (5%)</th>
                                <th className="p-3 font-bold text-right w-28">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {order.items?.map((item, idx) => {
                                const taxAmount = (item.totalPrice * 0.05); // Calculating 5% based on total for this line
                                const grandLineTotal = item.totalPrice + taxAmount; // Show final line total with tax for invoice, assuming exclusive. If inclusive, this logic can be adjusted.

                                return (
                                    <tr key={idx} className="text-sm text-slate-800 border-b border-slate-200">
                                        <td className="p-3 border-r border-slate-300 text-center font-medium bg-slate-50/50">{idx + 1}</td>
                                        <td className="p-3 border-r border-slate-300 min-w-[200px]">
                                            <p className="font-bold text-slate-900">{item.designName || item.productName || 'Custom Equipment'}</p>
                                            <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">SKU: {item.sku} {item.size ? `| Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}</p>
                                            {item.isCustomDesign && <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded border border-blue-200">Custom Design</span>}
                                        </td>
                                        <td className="p-3 border-r border-slate-300 text-center font-bold bg-slate-50/50">{item.quantity}</td>
                                        <td className="p-3 border-r border-slate-300 text-right whitespace-nowrap">{currency}{item.unitPrice?.toFixed(2)}</td>
                                        <td className="p-3 border-r border-slate-300 text-right font-medium text-slate-700 whitespace-nowrap">{currency}{item.totalPrice?.toFixed(2)}</td>
                                        <td className="p-3 border-r border-slate-300 text-right text-slate-600 whitespace-nowrap">{currency}{taxAmount.toFixed(2)}</td>
                                        <td className="p-3 text-right font-black text-slate-900 bg-slate-50/50 whitespace-nowrap">{currency}{grandLineTotal.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-3 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold text-slate-900">{currency}{order.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="font-semibold text-slate-900">{currency}{order.shippingTotal?.toFixed(2)}</span>
                        </div>
                        {order.discountTotal > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span className="font-semibold">-{currency}{order.discountTotal?.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-900 pt-3 mt-3">
                            <span className="font-bold text-slate-900 uppercase tracking-widest">Grand Total</span>
                            <span className="text-xl font-black text-slate-900">{currency}{order.grandTotal?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-20 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
                    <p>Thank you for shopping with Sparrow Sports. This is a computer generated invoice.</p>
                </div>

            </div>

            {/* Global Print Styles (Only applied on this specific page via jsx global mapping to avoid next.js layout issues) */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-\\[21cm\\] * {
            visibility: visible;
          }
          .max-w-\\[21cm\\] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}} />
        </div>
    );
}
