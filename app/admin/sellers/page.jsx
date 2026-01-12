'use client';
import { useAppContext } from '@/context/AppContext';

export default function AdminSellers() {
    const { user } = useAppContext();
    if (!user) return <div className="p-8">Please sign in</div>;
    return <div className="p-8"><h1 className="text-3xl font-bold">Sellers</h1></div>;
}
