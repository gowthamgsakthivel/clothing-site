'use client';
import React, { useEffect, useState } from 'react';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?page=${p}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      } else {
        alert(data.message || 'Failed to load reviews');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.filter(r => r._id !== id));
        alert('Deleted');
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reviews Management</h1>
      <p className="mb-4 text-sm text-gray-600">View and remove spam or inappropriate reviews.</p>
      {loading ? <div>Loading...</div> : (
        <div>
          <div className="grid gap-4">
            {reviews.map(r => (
              <div key={r._id} className="p-4 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{r.title} — {r.rating}★</div>
                    <div className="text-sm text-gray-600">By: {r.userName || r.userEmail || 'Anonymous'}</div>
                    <div className="mt-2">{r.comment}</div>
                    <div className="text-xs text-gray-500 mt-2">Product: {r.productId} • {new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => handleDelete(r._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button disabled={page<=1} onClick={() => fetchReviews(page-1)} className="px-3 py-1 border rounded">Prev</button>
            <span>Page {page} • {total} reviews</span>
            <button disabled={reviews.length===0} onClick={() => fetchReviews(page+1)} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
