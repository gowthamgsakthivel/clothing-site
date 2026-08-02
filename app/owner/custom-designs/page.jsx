'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import {
    Palette, Search, Download, MessageSquare, ArrowRight,
    Sparkles, RefreshCw, CheckCircle2, Clock, DollarSign,
    Layers, X, ShoppingCart, Send
} from 'lucide-react';

const OwnerCustomDesigns = () => {
    const { getToken } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [quotePrice, setQuotePrice] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const response = await axios.get('/api/custom-design/list?role=admin', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setRequests(response.data.designs || []);
            } else {
                toast.error(response.data.message || 'Failed to fetch requests');
            }
        } catch (error) {
            console.error('Error fetching custom design requests:', error);
            toast.error('Failed to load design requests');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleSendQuote = async () => {
        if (!selectedRequest || !quotePrice) {
            toast.error('Please enter a valid quote price');
            return;
        }

        try {
            setIsSubmittingQuote(true);
            const token = await getToken();

            const response = await axios.post(
                '/api/custom-design/admin-respond',
                {
                    requestId: selectedRequest._id,
                    price: Number(quotePrice),
                    notes: adminNotes
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Quote submitted to customer');
                setSelectedRequest(null);
                setQuotePrice('');
                setAdminNotes('');
                fetchRequests();
            } else {
                toast.error(response.data.message || 'Failed to submit quote');
            }
        } catch (error) {
            console.error('Error submitting quote:', error);
            toast.error('Failed to send price quote');
        } finally {
            setIsSubmittingQuote(false);
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const matchesSearch =
                r.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.contactPhone?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [requests, searchTerm, statusFilter]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                        Pending Quote
                    </span>
                );
            case 'quoted':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        Quote Sent
                    </span>
                );
            case 'negotiating':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                        Negotiating
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        Approved / Converted
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
                        Declined
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {status || 'pending'}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Custom Apparel Submissions</h2>
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                            {requests.length} Requests Total
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Manage team jersey customizations, review artwork, and send price quotes.</p>
                </div>

                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                    <span>Sync Submissions</span>
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by team name, contact email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Request Statuses</option>
                        <option value="pending">Pending Quote</option>
                        <option value="quoted">Quoted</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Declined</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-slate-500 font-medium">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-3" />
                        Loading custom design requests...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-16 text-center text-slate-500">
                        <Palette className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h4 className="text-base font-extrabold text-slate-900">No requests found</h4>
                        <p className="text-xs text-slate-500 mt-1">Custom apparel design submissions will display here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Team / Buyer</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Sport / Quantity</th>
                                    <th className="px-6 py-4">Current Quote</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Submitted</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.map((r) => (
                                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{r.teamName || 'Custom Team'}</p>
                                            <p className="text-[11px] font-mono text-indigo-600 mt-0.5">#{r._id.slice(-6)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-800 font-semibold">{r.contactEmail}</p>
                                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.contactPhone || 'No Phone'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800 capitalize">{r.sportCategory || 'General'}</span>
                                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.quantity || 1} Apparel Units</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-black text-slate-900">
                                            {r.adminQuote ? `₹${r.adminQuote}` : 'Not Quoted'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(r.status)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-500">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(r);
                                                    setQuotePrice(r.adminQuote || '');
                                                    setAdminNotes(r.adminNotes || '');
                                                }}
                                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                                            >
                                                Review & Quote
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review & Quote Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{selectedRequest.teamName || 'Custom Design Request'}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Submitted by {selectedRequest.contactEmail}</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Specs Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Sport Category:</span>
                                <p className="font-bold text-slate-900 mt-0.5 capitalize">{selectedRequest.sportCategory || 'General'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Target Quantity:</span>
                                <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.quantity || 1} Items</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Contact Phone:</span>
                                <p className="font-mono text-slate-800 mt-0.5">{selectedRequest.contactPhone || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Status:</span>
                                <div className="mt-0.5">{getStatusBadge(selectedRequest.status)}</div>
                            </div>
                        </div>

                        {/* Quote Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Quote Price Offer (₹) *</label>
                                <input
                                    type="number"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                    placeholder="Enter total price quote for order..."
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 font-mono font-bold text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Message to Buyer / Specifications</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Include terms, printing technique details, expected lead time..."
                                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendQuote}
                                disabled={isSubmittingQuote}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSubmittingQuote ? 'Submitting...' : 'Submit Quote to Customer'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerCustomDesigns;
