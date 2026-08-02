'use client';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    Users, Search, ShieldCheck, User, Filter,
    RefreshCw, Sparkles, X, Edit3, Calendar, Mail
} from 'lucide-react';

const OwnerCustomers = () => {
    const { getToken } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('user');
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const params = filterRole !== 'all' ? `?role=${filterRole}` : '';
            const response = await axios.get(`/api/admin/users${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUsers(response.data.users || []);
            } else {
                toast.error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [filterRole, getToken]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
                    <ShieldCheck className="w-3 h-3 text-rose-600" />
                    Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                <User className="w-3 h-3 text-indigo-600" />
                User
            </span>
        );
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h2>
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                            {users.length} Users Registered
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Manage user accounts, roles, access levels, and registration histories.</p>
                </div>

                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                    <span>Sync Directory</span>
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search customers by full name or primary email address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Regular Users</option>
                        <option value="admin">Admins Only</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-slate-500 font-medium">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-3" />
                        Loading customer records...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-16 text-center text-slate-500">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h4 className="text-base font-extrabold text-slate-900">No customers found</h4>
                        <p className="text-xs text-slate-500 mt-1">No user accounts matched your search terms.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Customer Name</th>
                                    <th className="px-6 py-4">Email Address</th>
                                    <th className="px-6 py-4">Role / Access</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((u) => {
                                    const initials = (u.name || u.email || 'U').slice(0, 2).toUpperCase();

                                    return (
                                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{u.name || 'Anonymous User'}</p>
                                                        <p className="text-[10px] font-mono text-slate-500">ID: {u._id.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-700">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(u.role || 'user')}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setNewRole(u.role || 'user');
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Edit Role
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Role Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Update Access Role</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedUser.name || selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Email:</span>
                                <span className="font-mono text-slate-800 ml-2">{selectedUser.email}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Current Role:</span>
                                <span className="font-mono text-indigo-600 ml-2 uppercase font-bold">{selectedUser.role || 'user'}</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <label className="font-bold text-slate-700 block">Select Permission Role</label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none font-bold"
                            >
                                <option value="user">User (Standard Customer Access)</option>
                                <option value="admin">Admin (Full Store Management Access)</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRoleChange(selectedUser._id, newRole)}
                                disabled={isUpdating}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                            >
                                {isUpdating ? 'Updating...' : 'Save Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerCustomers;
