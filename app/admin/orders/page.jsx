'use client';
import { useAppContext } from '@/context/AppContext';

export default function AdminOrders() {
    const { user } = useAppContext();

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Please sign in</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="mt-4 text-gray-600">Order management coming soon</p>
        </div>
    );
}
