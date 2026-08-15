'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEOMetadata from "@/components/SEOMetadata";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import OrderCard from "@/components/order/OrderCard";
import { useRouter } from "next/navigation";
import {
  Package, Truck, CheckCircle2, Clock, Search,
  RefreshCw, Sparkles, ShoppingBag, ArrowRight,
  Filter, AlertCircle, X, ShieldAlert, ChevronRight
} from "lucide-react";

export default function MyOrders() {
  const router = useRouter();
  const { currency = '₹', getToken, user } = useAppContext();

  const [allOrders, setAllOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!user) {
        setLoading(false);
        setIsRefreshing(false);
        setError("Please sign in to view your orders");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Authentication session expired. Please sign in again.");
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const { data } = await axios.get('/api/orders/list', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 12000
      });

      if (data.success && Array.isArray(data.orders)) {
        setAllOrders(data.orders);
        setLastUpdated(new Date());
        setError(null);
        if (isManualRefresh) {
          toast.success("Orders updated");
        }
      } else {
        setError(data.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
        setTimeout(() => router.push("/sign-in"), 1800);
      } else {
        setError(err.response?.data?.message || err.message || "Unable to connect to order server");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, router, user]);

  useEffect(() => {
    if (user === false) {
      router.push("/sign-in");
    } else if (user) {
      fetchOrders();
    }
  }, [user, router, fetchOrders]);

  // Statistics overview calculation
  const stats = useMemo(() => {
    const total = allOrders.length;
    const active = allOrders.filter(o => {
      const s = (o.shipment_status || o.status || '').toLowerCase();
      return ['placed', 'processing', 'packed', 'shipped', 'in transit', 'out for delivery'].includes(s);
    }).length;
    const delivered = allOrders.filter(o => {
      const s = (o.shipment_status || o.status || '').toLowerCase();
      return ['delivered', 'completed'].includes(s);
    }).length;
    const custom = allOrders.filter(o => o.items?.some(i => i.isCustomDesign)).length;
    const totalSpent = allOrders.reduce((sum, o) => {
      const isCancelled = ['cancelled', 'failed', 'rejected', 'rto'].includes((o.status || '').toLowerCase());
      return isCancelled ? sum : sum + Number(o.amount || o.totalAmount || 0);
    }, 0);

    return { total, active, delivered, custom, totalSpent };
  }, [allOrders]);

  // Filtered & Sorted orders list
  const displayedOrders = useMemo(() => {
    let list = [...allOrders];

    // 1. Tab Filter
    if (activeFilter === 'active') {
      list = list.filter(o => {
        const s = (o.shipment_status || o.status || '').toLowerCase();
        return ['placed', 'processing', 'packed', 'shipped', 'in transit', 'out for delivery'].includes(s);
      });
    } else if (activeFilter === 'delivered') {
      list = list.filter(o => {
        const s = (o.shipment_status || o.status || '').toLowerCase();
        return ['delivered', 'completed'].includes(s);
      });
    } else if (activeFilter === 'custom') {
      list = list.filter(o => o.items?.some(i => i.isCustomDesign));
    } else if (activeFilter === 'cancelled') {
      list = list.filter(o => {
        const s = (o.shipment_status || o.status || '').toLowerCase();
        return ['cancelled', 'failed', 'rejected', 'rto'].includes(s);
      });
    }

    // 2. Search Query (orderCode, product name, designName, awb)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o => {
        const code = (o.orderCode || o._id || '').toLowerCase();
        const awb = (o.awb_code || '').toLowerCase();
        const hasItem = o.items?.some(i =>
          (i.name || i.designName || i.product?.name || '').toLowerCase().includes(q)
        );
        return code.includes(q) || awb.includes(q) || hasItem;
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.date ? (typeof a.date === 'number' ? a.date * 1000 : a.date) : a.createdAt || 0);
      const dateB = new Date(b.date ? (typeof b.date === 'number' ? b.date * 1000 : b.date) : b.createdAt || 0);

      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'highest') return Number(b.amount || 0) - Number(a.amount || 0);
      return dateB - dateA;
    });

    return list;
  }, [allOrders, activeFilter, searchQuery, sortBy]);

  const filterTabs = [
    { id: 'all', label: 'All Orders', count: stats.total },
    { id: 'active', label: 'In Transit', count: stats.active, icon: Truck },
    { id: 'delivered', label: 'Delivered', count: stats.delivered, icon: CheckCircle2 },
    { id: 'custom', label: 'Custom Jerseys', count: stats.custom, icon: Sparkles },
    { id: 'cancelled', label: 'Cancelled', count: allOrders.length - (stats.active + stats.delivered) }
  ];

  return (
    <>
      <SEOMetadata
        title="My Orders & Tracking | Sparrow Sports"
        description="Track your sportswear, custom jerseys, and athletic apparel orders in real-time."
        url="/my-orders"
      />

      <main className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 space-y-6 sm:space-y-8">
          
          {/* Top Breadcrumb & Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                <Link href="/" className="hover:text-slate-700 transition">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-orange-600">My Orders</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Order History & Tracking
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Monitor current deliveries, view invoices, and reorder your favorite athletic gear.
              </p>
            </div>

            {/* Refresh Button */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              {lastUpdated && (
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                  Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchOrders(true)}
                disabled={isRefreshing || loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Updating...' : 'Refresh Orders'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Dashboard Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Transit</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.active}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Custom Jerseys</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.custom}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivered</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.delivered}</p>
              </div>
            </div>
          </div>

          {/* Search Bar & Filter Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative w-full flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID (#ORD-123), Product Name, or Tracking ID..."
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 shadow-2xs focus:outline-none focus:border-orange-500 transition cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="highest">Sort: Highest Total</option>
                </select>
              </div>
            </div>

            {/* Filter Tabs Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Content Area */}
          {error ? (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3 animate-fadeIn">
              <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm font-bold">{error}</p>
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition active:scale-95"
              >
                Retry Loading Orders
              </button>
            </div>
          ) : loading ? (
            /* Skeleton Loading Cards */
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 animate-pulse shadow-xs"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded-md" />
                      <div className="h-3 w-20 bg-slate-100 rounded-md" />
                    </div>
                    <div className="h-6 w-24 bg-slate-200 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                        <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedOrders.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  {searchQuery
                    ? "No matching orders found"
                    : activeFilter !== "all"
                    ? `No ${activeFilter} orders`
                    : "You haven't placed any orders yet"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {searchQuery
                    ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different term.`
                    : "Discover championship-grade sports wear, training gear, or design custom team jerseys today."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {searchQuery || activeFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95"
                  >
                    Clear Filters & Show All
                  </button>
                ) : (
                  <>
                    <Link
                      href="/all-products"
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Explore Sports Gear</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/custom-design"
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-2xs transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Design Custom Jersey</span>
                      <Sparkles className="w-4 h-4 text-orange-500" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-6 animate-fadeIn">
              {displayedOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  currency={currency}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}