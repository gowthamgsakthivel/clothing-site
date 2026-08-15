'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { Star, Trash2, RefreshCw, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';
import Loading from '@/components/Loading';

const AdminReviewsPage = () => {
  const { getToken } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/reviews?page=${p}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      } else {
        toast.error(data.message || 'Failed to load reviews');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.filter(r => r._id !== id));
        toast.success('Review removed');
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review Moderation</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {total} Total Reviews
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Moderate customer reviews, ratings, and remove inappropriate content.</p>
        </div>

        <button
          onClick={() => fetchReviews(page)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Reviews</span>
        </button>
      </div>

      {/* Reviews Grid / List */}
      {loading ? (
        <div className="p-10 text-center text-slate-500 font-medium bg-white border border-slate-200 rounded-3xl">
          <Loading size="md" text="Loading customer reviews..." />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl">
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-extrabold text-slate-900">No reviews found</h4>
          <p className="text-xs text-slate-500 mt-1">Product feedback from customers will display here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div
                key={r._id}
                className="group relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {renderStars(r.rating || 5)}
                      <span className="font-mono text-xs font-extrabold text-slate-900">({r.rating} / 5)</span>
                    </div>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {r.title && (
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1.5">{r.title}</h4>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{r.comment}&quot;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>By: <strong className="text-slate-900 font-sans">{r.userName || r.userEmail || 'Customer'}</strong></span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-600">
            <button
              disabled={page <= 1}
              onClick={() => fetchReviews(page - 1)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono font-bold text-slate-900">
              Page {page} • {total} Reviews Total
            </span>
            <button
              disabled={reviews.length === 0}
              onClick={() => fetchReviews(page + 1)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
