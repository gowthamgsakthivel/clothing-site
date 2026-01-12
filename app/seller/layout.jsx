'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React from 'react'
import { useAppContext } from '@/context/AppContext'
import Loading from '@/components/Loading'

const Layout = ({ children }) => {
  const { user } = useAppContext();

  if (user === undefined) {
    // Still loading user data
    return <Loading />;
  }

  if (!user) {
    // User not authenticated
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-medium mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access the seller dashboard.</p>
          <a href="/sign-in" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className='flex w-full max-w-[100vw] overflow-x-hidden pt-16'>
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout