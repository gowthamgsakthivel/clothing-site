'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const OwnerCustomers = () => {
    const { getToken } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('customer');
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const params = filterRole !== 'all' ? `?role=${filterRole}` : '';
            const response = await axios.get(`/api/admin/users${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                toast.error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            setIsUpdating(true);
            const token = await getToken();

            const response = await axios.patch(
                `/api/admin/users/${userId}`,
                { role },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('User role updated');
                setSelectedUser(null);
                fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user role');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'seller':
                return 'bg-purple-100 text-purple-800';
            case 'customer':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 w-full">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/owner" className="text-orange-600 hover:text-orange-700">
                            ← Owner Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Customer Management</h1>
                    <p className="text-gray-600 mt-2">Manage customer accounts and roles</p>
                </div>

                <div className="mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Roles</option>
                            <option value="customer">Customers</option>
                            <option value="seller">Sellers</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(u => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {u.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role || 'customer')}`}>
                                                    {u.role || 'customer'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setNewRole(u.role || 'customer');
                                                    }}
                                                    className="text-orange-600 hover:text-orange-700 font-medium"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update User Role</h2>

                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-medium text-gray-900">{selectedUser.name || 'N/A'}</p>
                                <p className="text-sm text-gray-600 mt-3">Email</p>
                                <p className="font-medium text-gray-900 break-all">{selectedUser.email}</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    User Role
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="seller">Seller</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleRoleChange(selectedUser._id, newRole)}
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium transition"
                                >
                                    {isUpdating ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerCustomers;
