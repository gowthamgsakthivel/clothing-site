'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import {
    MessageSquare, Mail, RefreshCw, Reply, CheckCircle2,
    X, Sparkles, User, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import Loading from '@/components/Loading';

export default function OwnerMessages() {
    const { user, getToken } = useAppContext();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [replyModal, setReplyModal] = useState({ open: false, contactId: null, subject: '', body: '' });

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await axios.get('/api/admin/contacts', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                setContacts(res.data.contacts || []);
            } else {
                toast.error(res.data?.message || 'Failed to load messages');
            }
        } catch (err) {
            console.error('Failed to fetch messages', err);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (!user) return;
        fetchMessages();
    }, [user, fetchMessages]);

    const updateContact = async (id, update) => {
        const previous = contacts;
        const optimistic = contacts.map(c => c._id === id ? { ...c, ...update } : c);
        setContacts(optimistic);

        try {
            const token = await getToken();
            const res = await axios.patch(`/api/admin/contacts/${id}`, update, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                setContacts(prev => prev.map(c => c._id === id ? res.data.contact : c));
                toast.success('Message updated');
            } else {
                setContacts(previous);
                toast.error(res.data?.message || 'Update failed');
            }
        } catch (err) {
            console.error('Update contact error', err);
            setContacts(previous);
            toast.error('Update failed');
        }
    };

    const openReply = (contact) => {
        setReplyModal({ open: true, contactId: contact._id, subject: `Re: Contact Inquiry from ${contact.name}`, body: `Hi ${contact.name},\n\nThank you for reaching out to Sparrow Sports.\n\n` });
    };

    const closeReply = () => setReplyModal({ open: false, contactId: null, subject: '', body: '' });

    const sendReply = async () => {
        const { contactId, subject, body } = replyModal;
        if (!contactId) return;

        const prev = contacts;
        setContacts(prevList => prevList.map(c => c._id === contactId ? { ...c, status: 'replied' } : c));
        closeReply();

        try {
            const token = await getToken();
            const res = await axios.post(`/api/admin/contacts/${contactId}/reply`, { subject, body }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                setContacts(prevList => prevList.map(c => c._id === contactId ? res.data.contact : c));
                toast.success('Reply dispatched via email');
            } else {
                setContacts(prev);
                toast.error(res.data?.message || 'Failed to send reply');
            }
        } catch (err) {
            console.error('Send reply error', err);
            setContacts(prev);
            toast.error('Failed to send reply');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            new: 'bg-amber-50 text-amber-700 border-amber-200',
            read: 'bg-blue-50 text-blue-700 border-blue-200',
            replied: 'bg-purple-50 text-purple-700 border-purple-200',
            resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize border ${map[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {status || 'new'}
            </span>
        );
    };

    if (!user) return <div className="p-8 text-slate-900 font-bold">Please sign in to access messages.</div>;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Messages</h2>
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                            {contacts.length} Enquiries
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Manage contact form inquiries, send email responses, and resolve support requests.</p>
                </div>

                <button
                    onClick={fetchMessages}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                    <span>Sync Inbox</span>
                </button>
            </div>

            {/* Messages Table Container */}
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-slate-500 font-medium">
                        <Loading size="md" text="Loading inbox messages..." />
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="p-16 text-center text-slate-500">
                        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h4 className="text-base font-extrabold text-slate-900">Inbox is clear!</h4>
                        <p className="text-xs text-slate-500 mt-1">Customer inquiries submitted through contact forms will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Sender Info</th>
                                    <th className="px-6 py-4">Message Content</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Submitted</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {contacts.map((contact) => (
                                    <tr key={contact._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{contact.name}</p>
                                            <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{contact.email}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs sm:max-w-md">
                                            {expanded === contact._id ? (
                                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                                                    {contact.message}
                                                </div>
                                            ) : (
                                                <p className="text-slate-700 truncate">
                                                    {contact.message}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(contact.status)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-500">
                                            {new Date(contact.submittedAt || contact.createdAt || contact.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setExpanded(expanded === contact._id ? null : contact._id)}
                                                    className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 transition-all shadow-sm"
                                                    title={expanded === contact._id ? "Collapse message" : "Expand message"}
                                                >
                                                    {expanded === contact._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => openReply(contact)}
                                                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    <Reply className="w-3.5 h-3.5" />
                                                    <span>Reply</span>
                                                </button>
                                                {contact.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => updateContact(contact._id, { status: 'resolved' })}
                                                        className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                                                        title="Mark resolved"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Email Reply Modal */}
            {replyModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Send Customer Email Reply</h3>
                                    <p className="text-xs text-slate-500">Will be sent via Nodemailer email gateway</p>
                                </div>
                            </div>
                            <button onClick={closeReply} className="p-2 rounded-xl text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject Line</label>
                                <input
                                    value={replyModal.subject}
                                    onChange={(e) => setReplyModal(r => ({ ...r, subject: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Message Body</label>
                                <textarea
                                    value={replyModal.body}
                                    onChange={(e) => setReplyModal(r => ({ ...r, body: e.target.value }))}
                                    rows={8}
                                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 focus:border-indigo-500 focus:outline-none leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                onClick={closeReply}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendReply}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                <span>Send Email</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
