'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';

const ProfilePage = () => {
    const { user, isLoaded } = useUser();
    const { currency, router: appRouter } = useAppContext();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);
    const [orders, setOrders] = useState([]);
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

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.push('/sign-in');
            return;
        }
        fetchUserData();
    }, [user, isLoaded]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const [addressRes, ordersRes] = await Promise.all([
                axios.get('/api/address'),
                axios.get('/api/user/orders')
            ]);

            if (addressRes.data.success) {
                setAddresses(addressRes.data.addresses);
            }

            if (ordersRes.data.success) {
                setOrders(ordersRes.data.orders);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingAddress) {
                // Update existing address
                const { data } = await axios.put(`/api/address/${editingAddress._id}`, addressForm);
                if (data.success) {
                    toast.success('Address updated successfully');
                    fetchUserData();
                    resetAddressForm();
                }
            } else {
                // Add new address
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

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-gray-600">{user?.emailAddresses?.[0]?.emailAddress}</p>
                            <div className="flex gap-4 mt-2">
                                <span className="text-sm text-gray-500">
                                    📦 {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                                </span>
                                <span className="text-sm text-gray-500">
                                    📍 {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {[
                                { id: 'overview', label: 'Overview', icon: '📊' },
                                { id: 'orders', label: 'My Orders', icon: '📦' },
                                { id: 'addresses', label: 'Addresses', icon: '📍' },
                                { id: 'settings', label: 'Settings', icon: '⚙️' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Overview</h2>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="border rounded-lg p-6 hover:shadow-md transition">
                                    <div className="text-3xl mb-2">📦</div>
                                    <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                                    <div className="text-sm text-gray-600">Total Orders</div>
                                </div>

                                <div className="border rounded-lg p-6 hover:shadow-md transition">
                                    <div className="text-3xl mb-2">✅</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {orders.filter(o => o.status === 'Delivered').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Delivered</div>
                                </div>

                                <div className="border rounded-lg p-6 hover:shadow-md transition">
                                    <div className="text-3xl mb-2">🚚</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {orders.filter(o => ['Processing', 'Shipped', 'Out for Delivery'].includes(o.status)).length}
                                    </div>
                                    <div className="text-sm text-gray-600">In Progress</div>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <div className="mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        View All →
                                    </button>
                                </div>

                                {orders.slice(0, 3).length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.slice(0, 3).map(order => (
                                            <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-900">Order #{order._id.slice(-8)}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-600">
                                                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {currency}{order.totalAmount}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                                        <div className="text-6xl mb-4">📦</div>
                                        <p className="text-gray-600 mb-4">No orders yet</p>
                                        <button
                                            onClick={() => router.push('/all-products')}
                                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Saved Addresses */}
                            <div className="mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                                    <button
                                        onClick={() => setActiveTab('addresses')}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        Manage →
                                    </button>
                                </div>

                                {addresses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.slice(0, 2).map(address => (
                                            <div key={address._id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-medium text-gray-900">{address.fullName}</p>
                                                    {address.isDefault && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Default</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {address.area}, {address.city}<br />
                                                    {address.state} - {address.pincode}<br />
                                                    📞 {address.phoneNumber}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border rounded-lg bg-gray-50">
                                        <p className="text-gray-600 mb-3">No saved addresses</p>
                                        <button
                                            onClick={() => setActiveTab('addresses')}
                                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            Add Address →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">My Orders</h2>

                            {orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order._id} className="border rounded-lg p-6 hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        Order #{order._id.slice(-8)}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            {/* Order Items */}
                                            <div className="space-y-3 mb-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                                        <div className="w-16 h-16 bg-white rounded flex items-center justify-center">
                                                            {item.image?.[0] ? (
                                                                <Image
                                                                    src={item.image[0]}
                                                                    alt={item.name}
                                                                    width={64}
                                                                    height={64}
                                                                    className="object-cover rounded"
                                                                />
                                                            ) : (
                                                                <span className="text-2xl">📦</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {item.size && `Size: ${item.size}`}
                                                                {item.size && item.color && ' • '}
                                                                {item.color && `Color: ${item.color}`}
                                                            </p>
                                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900">{currency}{item.price}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Summary */}
                                            <div className="flex justify-between items-center pt-4 border-t">
                                                <div className="text-sm text-gray-600">
                                                    Payment: <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Total Amount</p>
                                                    <p className="text-xl font-bold text-gray-900">{currency}{order.totalAmount}</p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={() => router.push(`/my-orders?orderId=${order._id}`)}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                                >
                                                    View Details
                                                </button>
                                                {order.status === 'Delivered' && order.items.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            // Navigate to the first product to leave a review
                                                            const firstItem = order.items[0];
                                                            if (firstItem.product?._id || firstItem.isCustomDesign) {
                                                                const productId = firstItem.product?._id || firstItem.customDesignId;
                                                                router.push(`/product/${productId}#reviews`);
                                                            }
                                                        }}
                                                        className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition"
                                                    >
                                                        Leave Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="text-8xl mb-4">📦</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                                    <p className="text-gray-600 mb-6">Start shopping and your orders will appear here</p>
                                    <button
                                        onClick={() => router.push('/all-products')}
                                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                                    >
                                        Browse Products
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === 'addresses' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                                <button
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                                >
                                    {showAddressForm ? 'Cancel' : '+ Add New Address'}
                                </button>
                            </div>

                            {/* Address Form */}
                            {showAddressForm && (
                                <form onSubmit={handleAddressSubmit} className="mb-8 p-6 border rounded-lg bg-gray-50">
                                    <h3 className="text-lg font-semibold mb-4">
                                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={addressForm.fullName}
                                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                            required
                                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={addressForm.phoneNumber}
                                            onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                                            required
                                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            value={addressForm.pincode}
                                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                            required
                                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Area/Locality"
                                            value={addressForm.area}
                                            onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                                            required
                                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={addressForm.city}
                                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                            required
                                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={addressForm.state}
                                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                            required
                                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={addressForm.isDefault}
                                                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700">Set as default address</span>
                                        </label>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                                        >
                                            {editingAddress ? 'Update Address' : 'Save Address'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetAddressForm}
                                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Address List */}
                            {addresses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map(address => (
                                        <div key={address._id} className="border rounded-lg p-6 hover:shadow-md transition">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
                                                {address.isDefault && (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{address.area}</p>
                                                <p>{address.city}, {address.state} - {address.pincode}</p>
                                                <p className="flex items-center gap-2 mt-2">
                                                    <span>📞</span> {address.phoneNumber}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 mt-4 pt-4 border-t">
                                                <button
                                                    onClick={() => handleEditAddress(address)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(address._id)}
                                                    className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 border rounded-lg">
                                    <div className="text-8xl mb-4">📍</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Addresses</h3>
                                    <p className="text-gray-600 mb-6">Add your first address for faster checkout</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>

                            <div className="space-y-6">
                                {/* Personal Information */}
                                <div className="border rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <p className="text-gray-900">{user?.emailAddresses?.[0]?.emailAddress}</p>
                                        </div>
                                        <button
                                            onClick={() => router.push('/sign-in')}
                                            className="px-4 py-2 text-orange-600 border border-orange-300 rounded-lg text-sm font-medium hover:bg-orange-50 transition"
                                        >
                                            Manage Account via Clerk
                                        </button>
                                    </div>
                                </div>

                                {/* Preferences */}
                                <div className="border rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                                    <div className="space-y-4">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-gray-700">Email Notifications</span>
                                            <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" defaultChecked />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-gray-700">Order Updates</span>
                                            <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" defaultChecked />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-gray-700">Promotional Emails</span>
                                            <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" />
                                        </label>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="border rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => router.push('/wishlist')}
                                            className="w-full px-4 py-3 text-left border rounded-lg hover:bg-gray-50 transition flex items-center justify-between"
                                        >
                                            <span className="font-medium">View Wishlist</span>
                                            <span>→</span>
                                        </button>
                                        <button
                                            onClick={() => router.push('/notifications')}
                                            className="w-full px-4 py-3 text-left border rounded-lg hover:bg-gray-50 transition flex items-center justify-between"
                                        >
                                            <span className="font-medium">Notifications</span>
                                            <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
