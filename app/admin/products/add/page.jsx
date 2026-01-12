'use client';
import { redirect } from 'next/navigation';

// This page has been deprecated - functionality moved to manage-stock

export default function AddProductPage() {
    redirect('/admin/products/manage-stock');
}
