'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';

const COLLECTION_OPTIONS = [
  { value: 'products', label: 'Products' },
  { value: 'sports', label: 'Sports' },
  { value: 'devotional', label: 'Devotional' },
  { value: 'political', label: 'Political' }
];

const GENDER_OPTIONS = ['Unisex', 'Men', 'Women', 'Kids', 'Girls', 'Boys'];
const SPORT_OPTIONS = ['cricket', 'football', 'basketball', 'badminton', 'tennis', 'gym'];

const emptyProductState = {
  name: '',
  slug: '',
  description: '',
  brand: '',
  collectionName: 'products',
  sportCategory: '',
  category: '',
  genderCategory: 'Unisex',
  status: 'draft',
  metaTitle: '',
  metaDescription: ''
};

const EditProductPage = () => {
  const { user, getToken, router: appRouter } = useAppContext();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(emptyProductState);
  const [variants, setVariants] = useState([]);
  const [sharedImages, setSharedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const token = await getToken();

      const productResponse = await axios.get(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!productResponse.data?.success) {
        throw new Error(productResponse.data?.message || 'Failed to load product');
      }

      const payload = productResponse.data?.data || {};
      setProduct({
        ...emptyProductState,
        ...payload.product,
        sportCategory: payload.product?.sportCategory || '',
        metaTitle: payload.product?.metaTitle || '',
        metaDescription: payload.product?.metaDescription || ''
      });

      const nextVariants = (payload.variants || []).map((variant) => ({
        ...variant,
        images: Array.isArray(variant.images) ? variant.images : []
      }));
      setVariants(nextVariants);

      const firstImages = nextVariants[0]?.images || [];
      setSharedImages(Array.isArray(firstImages) ? firstImages : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [getToken, productId]);

  useEffect(() => {
    if (!user) {
      appRouter.push('/sign-in?return_to=%2Fowner%2Fproducts');
      return;
    }

    loadProduct();
  }, [appRouter, loadProduct, user]);

  const updateProductField = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const uploadImages = async (files) => {
    if (!files?.length) return;

    try {
      setUploadingImages(true);
      const token = await getToken();
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('/api/admin/uploads/image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Image upload failed');
        }

        uploadedUrls.push(response.data.url);
      }

      setSharedImages((prev) => [...prev, ...uploadedUrls]);
      toast.success('Images uploaded');
    } catch (error) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageIndex) => {
    setSharedImages((prev) => prev.filter((_, index) => index !== imageIndex));
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const token = await getToken();

      const productPayload = {
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        collectionName: product.collectionName,
        sportCategory: product.collectionName === 'sports' ? product.sportCategory : null,
        category: product.category,
        genderCategory: product.genderCategory,
        status: product.status,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription
      };

      const productResponse = await axios.put(`/api/admin/products/${productId}`, productPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!productResponse.data?.success) {
        throw new Error(productResponse.data?.message || 'Failed to update product');
      }

      const variantUpdates = variants.map((variant) => (
        axios.put(`/api/admin/variants/${variant._id}`, {
          images: sharedImages
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));

      const variantResponses = await Promise.all(variantUpdates);
      const failedVariant = variantResponses.find((response) => !response.data?.success);
      if (failedVariant) {
        throw new Error(failedVariant.data?.message || 'Failed to update variant images');
      }

      toast.success('Product updated successfully');
      await loadProduct();
    } catch (error) {
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading product...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
            <p className="text-sm text-slate-500">Update description and shared images here. Inventory stays in the separate inventory page.</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Product Info</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Name" value={product.name} onChange={(value) => updateProductField('name', value)} />
            <Field label="Slug" value={product.slug} onChange={(value) => updateProductField('slug', value)} />
            <Field label="Brand" value={product.brand} onChange={(value) => updateProductField('brand', value)} />
            <SelectField label="Collection" value={product.collectionName} onChange={(value) => updateProductField('collectionName', value)} options={COLLECTION_OPTIONS} />
            {product.collectionName === 'sports' && (
              <SelectField label="Sport Type" value={product.sportCategory} onChange={(value) => updateProductField('sportCategory', value)} options={SPORT_OPTIONS.map((item) => ({ value: item, label: item }))} />
            )}
            <Field label="Category" value={product.category} onChange={(value) => updateProductField('category', value)} />
            <SelectField label="Gender" value={product.genderCategory} onChange={(value) => updateProductField('genderCategory', value)} options={GENDER_OPTIONS.map((item) => ({ value: item, label: item }))} />
            <SelectField label="Status" value={product.status} onChange={(value) => updateProductField('status', value)} options={['draft', 'active', 'hidden', 'archived'].map((item) => ({ value: item, label: item }))} />
            <Field label="Meta Title" value={product.metaTitle} onChange={(value) => updateProductField('metaTitle', value)} />
            <Field label="Meta Description" value={product.metaDescription} onChange={(value) => updateProductField('metaDescription', value)} />
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={product.description}
              onChange={(event) => updateProductField('description', event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Shared Product Images</h2>
              <p className="text-sm text-slate-500">These images will be applied to every variant of this product.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/owner/inventory?product=${productId}`)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700 hover:bg-orange-100"
            >
              Open Inventory View
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-700">Product Images</label>
              <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                {uploadingImages ? 'Uploading...' : 'Add Images'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => uploadImages(Array.from(event.target.files || []))}
                />
              </label>
            </div>

            {sharedImages.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {sharedImages.map((imageUrl, imageIndex) => (
                  <div key={`${imageUrl}-${imageIndex}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <Image src={imageUrl} alt={`Product image ${imageIndex + 1}`} width={240} height={240} className="h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(imageIndex)}
                      className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white shadow hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No images attached yet.</p>
            )}

            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Inventory is managed from the separate inventory screen. This page only edits product details and shared images.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <select
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default EditProductPage;