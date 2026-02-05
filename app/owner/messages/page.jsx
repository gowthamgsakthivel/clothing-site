'use client';
import { useAppContext } from '@/context/AppContext';

export default function OwnerMessages() {
    const { user } = useAppContext();
    if (!user) return <div className="p-8">Please sign in</div>;
    return <div className="p-8"><h1 className="text-3xl font-bold">Messages</h1></div>;
}
