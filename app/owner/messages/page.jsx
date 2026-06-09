'use client';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';

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
        // Optimistic UI update: apply change locally and collapse expanded view
        const previous = contacts;
        const optimistic = contacts.map(c => c._id === id ? { ...c, ...update } : c);
        setContacts(optimistic);
        setExpanded(null);

        try {
            const token = await getToken();
            const res = await axios.patch(`/api/admin/contacts/${id}`, update, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                // Replace with authoritative server response
                setContacts(prev => prev.map(c => c._id === id ? res.data.contact : c));
                toast.success('Updated');
            } else {
                // Rollback
                setContacts(previous);
                toast.error(res.data?.message || 'Update failed');
            }
        } catch (err) {
            console.error('Update contact error', err);
            setContacts(previous);
            toast.error('Update failed');
        }
    }

    const openReply = (contact) => {
        setReplyModal({ open: true, contactId: contact._id, subject: `Re: ${contact.name}`, body: `Hi ${contact.name},\n\n` });
    }

    const closeReply = () => setReplyModal({ open: false, contactId: null, subject: '', body: '' });

    const sendReply = async () => {
        const { contactId, subject, body } = replyModal;
        if (!contactId) return;

        // optimistic update: mark replied and close modal
        const prev = contacts;
        setContacts(prevList => prevList.map(c => c._id === contactId ? { ...c, status: 'replied' } : c));
        closeReply();
        setExpanded(null);

        try {
            const token = await getToken();
            const res = await axios.post(`/api/admin/contacts/${contactId}/reply`, { subject, body }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                setContacts(prevList => prevList.map(c => c._id === contactId ? res.data.contact : c));
                toast.success('Reply sent');
            } else {
                setContacts(prev);
                toast.error(res.data?.message || 'Failed to send reply');
            }
        } catch (err) {
            console.error('Send reply error', err);
            setContacts(prev);
            toast.error('Failed to send reply');
        }
    }

    if (!user) return <div className="p-8">Please sign in</div>;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Messages</h1>
                <button onClick={fetchMessages} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded">Refresh</button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="overflow-x-auto bg-white shadow rounded">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">From</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">Message</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Submitted</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map(contact => (
                                <tr key={contact._id} className="border-t">
                                    <td className="p-3 align-top">{contact.name}</td>
                                    <td className="p-3 align-top">{contact.email}</td>
                                    <td className="p-3 align-top">
                                        <div className="max-w-xl">
                                            {expanded === contact._id ? (
                                                <div className="whitespace-pre-wrap">{contact.message}</div>
                                            ) : (
                                                <div>{(contact.message || '').slice(0, 140)}{(contact.message || '').length > 140 ? '…' : ''}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">
                                        <span className={`px-2 py-1 rounded text-xs ${contact.status === 'new' ? 'bg-yellow-100 text-yellow-800' : contact.status === 'read' ? 'bg-blue-100 text-blue-800' : contact.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {contact.status}
                                        </span>
                                    </td>
                                    <td className="p-3 align-top">{new Date(contact.submittedAt || contact.createdAt || contact.updatedAt).toLocaleString()}</td>
                                    <td className="p-3 align-top">
                                        <div className="flex gap-2">
                                            <button onClick={() => setExpanded(expanded === contact._id ? null : contact._id)} className="px-2 py-1 bg-gray-100 rounded">{expanded === contact._id ? 'Hide' : 'View'}</button>
                                            <button onClick={() => openReply(contact)} className="px-2 py-1 bg-purple-600 text-white rounded">Reply</button>
                                            {contact.status !== 'read' && (
                                                <button onClick={() => updateContact(contact._id, { status: 'read' })} className="px-2 py-1 bg-blue-600 text-white rounded">Mark read</button>
                                            )}
                                            {contact.status !== 'replied' && (
                                                <button onClick={() => updateContact(contact._id, { status: 'replied' })} className="px-2 py-1 bg-indigo-600 text-white rounded">Mark replied</button>
                                            )}
                                            {contact.status !== 'resolved' && (
                                                <button onClick={() => updateContact(contact._id, { status: 'resolved' })} className="px-2 py-1 bg-green-600 text-white rounded">Resolve</button>
                                            )}
                                        </div>

                                        {expanded === contact._id && (
                                            <div className="mt-3">
                                                <label className="block text-sm font-medium mb-1">Admin Notes</label>
                                                <AdminNotes contact={contact} onSave={(notes) => updateContact(contact._id, { adminNotes: notes })} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {contacts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-500">No messages found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {replyModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded p-6 w-full max-w-2xl">
                        <h3 className="text-lg font-bold mb-3">Send reply</h3>
                        <input value={replyModal.subject} onChange={(e) => setReplyModal(r => ({ ...r, subject: e.target.value }))} className="w-full mb-3 border rounded px-3 py-2" />
                        <textarea value={replyModal.body} onChange={(e) => setReplyModal(r => ({ ...r, body: e.target.value }))} rows={10} className="w-full border rounded p-2 mb-3" />
                        <div className="flex justify-end gap-2">
                            <button onClick={closeReply} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                            <button onClick={sendReply} className="px-3 py-1 bg-orange-600 text-white rounded">Send Reply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminNotes({ contact, onSave }) {
    const [notes, setNotes] = useState(contact.adminNotes || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await onSave(notes);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded p-2" rows={4} />
            <div className="flex justify-end mt-2">
                <button onClick={save} disabled={saving} className="px-3 py-1 bg-orange-600 text-white rounded">{saving ? 'Saving…' : 'Save Notes'}</button>
            </div>
        </div>
    );
}
