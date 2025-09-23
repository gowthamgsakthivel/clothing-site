'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SellerHomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/seller/dashboard');
  }, [router]);

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
      <p className="text-gray-600">Redirecting to dashboard...</p>
    </div>
  );
};

export default SellerHomePage;