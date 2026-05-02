'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Oswald, Sora } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { getDisplayOrderCode } from '@/lib/codeGenerators';

const headingFont = Oswald({ subsets: ['latin'], weight: ['400', '600', '700'] });
const bodyFont = Sora({ subsets: ['latin'], weight: ['300', '400', '600'] });

const ProfilePage = () => {
    const { user, isLoaded } = useUser();
    const { openUserProfile, signOut } = useClerk();
    const { currency } = useAppContext();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profileName, setProfileName] = useState('');
    const [nameDraft, setNameDraft] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);

    const [addressForm, setAddressForm] = useState({
        fullName: '',
        phoneNumber: '',
        pincode: '',
        area: '',
        city: '',
        state: '',
        isDefault: false
    });

    const fetchUserData = useCallback(async () => {
        setLoading(true);
        try {
            const [addressRes, ordersRes, userRes] = await Promise.all([
                axios.get('/api/address'),
                axios.get('/api/orders/list'),
                axios.get('/api/user/data')
            ]);

            if (addressRes.data.success) {
                setAddresses(addressRes.data.addresses);
            }

            if (ordersRes.data.success) {
                setOrders(ordersRes.data.orders);
            }

            if (userRes.data.success) {
                const name = userRes.data.user?.name || '';
                setProfileName(name);
                setNameDraft((prev) => (prev ? prev : name));
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.push('/sign-in');
            return;
        }
        fetchUserData();
    }, [user, isLoaded, router, fetchUserData]);

    const handleAddressSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingAddress) {
                const { data } = await axios.put(`/api/address/${editingAddress._id}`, addressForm);
                if (data.success) {
                    toast.success('Address updated successfully');
                    fetchUserData();
                    resetAddressForm();
                }
            } else {
                const { data } = await axios.post('/api/address', addressForm);
                if (data.success) {
                    toast.success('Address added successfully');
                    fetchUserData();
                    resetAddressForm();
                }
            }
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error(error.response?.data?.message || 'Failed to save address');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            const { data } = await axios.delete(`/api/address/${addressId}`);
            if (data.success) {
                toast.success('Address deleted successfully');
                fetchUserData();
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error('Failed to delete address');
        }
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setAddressForm({
            fullName: address.fullName,
            phoneNumber: address.phoneNumber,
            pincode: address.pincode,
            area: address.area,
            city: address.city,
            state: address.state,
            isDefault: address.isDefault || false
        });
        setShowAddressForm(true);
    };

    const resetAddressForm = () => {
        setAddressForm({
            fullName: '',
            phoneNumber: '',
            pincode: '',
            area: '',
            city: '',
            state: '',
            isDefault: false
        });
        setEditingAddress(null);
        setShowAddressForm(false);
    };

    const getOrderStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Processing': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-purple-100 text-purple-800',
            'Out for Delivery': 'bg-indigo-100 text-indigo-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800',
            'Returned': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleNameSave = async () => {
        const trimmedName = nameDraft.trim();
        if (!trimmedName) {
            toast.error('Please enter your name');
            return;
        }
        setIsSavingName(true);
        try {
            const { data } = await axios.patch('/api/user/profile', { name: trimmedName });
            if (data.success) {
                setProfileName(data.user?.name || trimmedName);
                setIsEditingName(false);
                toast.success('Profile name updated');
            } else {
                toast.error(data.message || 'Failed to update name');
            }
        } catch (error) {
            console.error('Error updating name:', error);
            toast.error(error.response?.data?.message || 'Failed to update name');
        } finally {
            setIsSavingName(false);
        }
    };

    const membershipYear = user?.createdAt
        ? new Date(user.createdAt).getFullYear()
        : null;

    const fallbackName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    const displayName = profileName || fallbackName || 'Sparrow Member';
    const primaryAddress = addresses.find((address) => address.isDefault) || addresses[0];

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    const sections = [
        { id: 'overview', label: 'Profile Overview' },
        { id: 'orders', label: 'Order History' },
        { id: 'addresses', label: 'Addresses' },
        { id: 'account', label: 'Account Settings' }
    ];

    return (
        <div className={`min-h-screen bg-slate-50 ${bodyFont.className}`}>
            <Navbar />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <aside className="space-y-4">
                        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-orange-100">
                                    {user?.imageUrl ? (
                                        <Image
                                            src={user.imageUrl}
                                            alt="Profile avatar"
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-orange-600">
                                            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className={`${headingFont.className} text-lg font-semibold text-gray-900`}>
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500">Member since {membershipYear || '—'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => openUserProfile()}
                                className="mt-4 w-full rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-600 transition hover:bg-orange-100"
                            >
                                Manage profile
                            </button>
                        </div>

                        <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-sm">
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                                            activeSection === section.id
                                                ? 'bg-orange-600 text-white'
                                                : 'text-gray-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => signOut(() => router.push('/'))}
                                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                    Sign out
                                </button>
                            </nav>
                        </div>
                    </aside>

                    <main className="space-y-6">
                        {activeSection === 'overview' && (
                            <div className="space-y-6">
                                <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.35em] text-orange-500">Profile Overview</p>
                                            <h1 className={`${headingFont.className} mt-2 text-3xl font-semibold text-gray-900`}>
                                                Welcome back, {displayName}.
                                            </h1>
                                            <p className="mt-3 text-sm text-gray-600">
                                                Keep your details updated and track your latest orders and saved addresses.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => router.push('/all-products')}
                                            className="w-full sm:w-auto rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500"
                                        >
                                            Shop now
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {[
                                        { label: 'Total Orders', value: orders.length },
                                        { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length },
                                        { label: 'Saved Addresses', value: addresses.length }
                                    ].map((stat) => (
                                        <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm">
                                            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{stat.label}</p>
                                            <p className={`${headingFont.className} mt-3 text-3xl font-semibold text-gray-900`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h2 className={`${headingFont.className} text-xl font-semibold text-gray-900`}>Recent Orders</h2>
                                            <button
                                                onClick={() => setActiveSection('orders')}
                                                className="text-xs font-semibold uppercase tracking-wider text-orange-600"
                                            >
                                                View all
                                            </button>
                                        </div>
                                        <div className="mt-4 space-y-4">
                                            {orders.slice(0, 3).map(order => (
                                                <div key={order._id} className="rounded-xl border border-gray-100 p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">Order #{getDisplayOrderCode(order)}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getOrderStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-xs text-gray-500">
                                                        {order.items.length} items • {currency}{order.totalAmount}
                                                    </p>
                                                </div>
                                            ))}
                                            {orders.length === 0 && (
                                                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                                    No orders yet. Start shopping to see your history here.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                        <h2 className={`${headingFont.className} text-xl font-semibold text-gray-900`}>Personal Info</h2>
                                        <div className="mt-4 space-y-4 text-sm text-gray-600">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Full Name</p>
                                                {isEditingName ? (
                                                    <div className="mt-2 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={nameDraft}
                                                            onChange={(e) => setNameDraft(e.target.value)}
                                                            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleNameSave}
                                                                disabled={isSavingName}
                                                                className="rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
                                                            >
                                                                {isSavingName ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setNameDraft(profileName || fallbackName);
                                                                    setIsEditingName(false);
                                                                }}
                                                                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 transition hover:bg-gray-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 flex items-center justify-between gap-3">
                                                        <p className="text-gray-900">{displayName}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNameDraft(displayName);
                                                                setIsEditingName(true);
                                                            }}
                                                            className="rounded-full border border-orange-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange-600 transition hover:bg-orange-50"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Email</p>
                                                <p className="mt-1 text-gray-900">{user?.emailAddresses?.[0]?.emailAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Phone</p>
                                                <p className="mt-1 text-gray-900">
                                                    {user?.phoneNumbers?.[0]?.phoneNumber || 'Not added yet'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openUserProfile()}
                                            className="mt-5 w-full rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-600 transition hover:bg-orange-50"
                                        >
                                            Manage account details
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <h2 className={`${headingFont.className} text-xl font-semibold text-gray-900`}>
                                            Default Shipping Address
                                        </h2>
                                        <button
                                            onClick={() => setActiveSection('addresses')}
                                            className="text-xs font-semibold uppercase tracking-wider text-orange-600"
                                        >
                                            Manage
                                        </button>
                                    </div>
                                    {primaryAddress ? (
                                        <div className="mt-4 text-sm text-gray-600">
                                            <p className="font-semibold text-gray-900">{primaryAddress.fullName}</p>
                                            <p className="mt-2">
                                                {primaryAddress.area}, {primaryAddress.city}
                                            </p>
                                            <p>{primaryAddress.state} - {primaryAddress.pincode}</p>
                                            <p className="mt-2">Phone: {primaryAddress.phoneNumber}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                                            No shipping address saved yet. Add one to speed up checkout.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'orders' && (
                            <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                <h2 className={`${headingFont.className} text-2xl font-semibold text-gray-900`}>Order History</h2>
                                <div className="mt-6 space-y-4">
                                    {orders.length > 0 ? (
                                        orders.map(order => (
                                            <div key={order._id} className="rounded-xl border border-gray-100 p-4 sm:p-5">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">Order #{getDisplayOrderCode(order)}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getOrderStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="mt-4 space-y-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-4 rounded-lg bg-slate-50 p-3">
                                                            <div className="relative h-12 w-12 overflow-hidden rounded bg-white">
                                                                {item.image?.[0] ? (
                                                                    <Image
                                                                        src={item.image[0]}
                                                                        alt={item.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="48px"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No Image</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {item.size && `Size: ${item.size}`}
                                                                    {item.size && item.color && ' • '}
                                                                    {item.color && `Color: ${item.color}`}
                                                                    {item.quantity && ` • Qty: ${item.quantity}`}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-900">{currency}{item.price}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4 text-sm">
                                                    <p className="text-gray-600">
                                                        Payment: <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                                                    </p>
                                                    <p className="text-lg font-semibold text-gray-900">{currency}{order.totalAmount}</p>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => router.push(`/my-orders?orderId=${order._id}`)}
                                                        className="w-full sm:w-auto rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        View details
                                                    </button>
                                                    {order.status === 'Delivered' && order.items.length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                const firstItem = order.items[0];
                                                                if (firstItem.product?._id || firstItem.isCustomDesign) {
                                                                    const productId = firstItem.product?._id || firstItem.customDesignId;
                                                                    router.push(`/product/${productId}#reviews`);
                                                                }
                                                            }}
                                                            className="w-full sm:w-auto rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-600 transition hover:bg-orange-50"
                                                        >
                                                            Leave review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-gray-200 p-8 sm:p-10 text-center">
                                            <p className="text-sm text-gray-600">No orders yet. Start shopping to build your history.</p>
                                            <button
                                                onClick={() => router.push('/all-products')}
                                                className="mt-4 w-full sm:w-auto rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500"
                                            >
                                                Browse products
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'addresses' && (
                            <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className={`${headingFont.className} text-2xl font-semibold text-gray-900`}>Saved Addresses</h2>
                                    <button
                                        onClick={() => setShowAddressForm(!showAddressForm)}
                                        className="w-full sm:w-auto rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500"
                                    >
                                        {showAddressForm ? 'Cancel' : 'Add new address'}
                                    </button>
                                </div>

                                {showAddressForm && (
                                    <form onSubmit={handleAddressSubmit} className="mt-6 rounded-2xl border border-gray-100 bg-slate-50 p-5">
                                        <h3 className={`${headingFont.className} text-lg font-semibold text-gray-900`}>
                                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                                        </h3>
                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={addressForm.fullName}
                                                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                                required
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number"
                                                value={addressForm.phoneNumber}
                                                onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                                                required
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                value={addressForm.pincode}
                                                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                required
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Area/Locality"
                                                value={addressForm.area}
                                                onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                                                required
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={addressForm.city}
                                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                required
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={addressForm.state}
                                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                                required
                                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                        <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={addressForm.isDefault}
                                                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                                className="h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            Set as default address
                                        </label>
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <button
                                                type="submit"
                                                className="w-full sm:w-auto rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-orange-500"
                                            >
                                                {editingAddress ? 'Update address' : 'Save address'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={resetAddressForm}
                                                className="w-full sm:w-auto rounded-full border border-gray-200 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 transition hover:bg-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {addresses.map(address => (
                                        <div key={address._id} className="rounded-2xl border border-gray-100 p-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{address.fullName}</p>
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        {address.area}, {address.city}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{address.state} - {address.pincode}</p>
                                                    <p className="mt-2 text-xs text-gray-500">Phone: {address.phoneNumber}</p>
                                                </div>
                                                {address.isDefault && (
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-700">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleEditAddress(address)}
                                                    className="w-full sm:flex-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 transition hover:bg-gray-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(address._id)}
                                                    className="w-full sm:flex-1 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {addresses.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                            No saved addresses yet. Add one for faster checkout.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'account' && (
                            <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
                                <h2 className={`${headingFont.className} text-2xl font-semibold text-gray-900`}>Account Settings</h2>
                                <p className="mt-3 text-sm text-gray-600">
                                    Update email, password, and account preferences from the secure profile manager.
                                </p>
                                <button
                                    onClick={() => openUserProfile()}
                                    className="mt-5 w-full sm:w-auto rounded-full border border-orange-200 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-orange-600 transition hover:bg-orange-50"
                                >
                                    Open account manager
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
