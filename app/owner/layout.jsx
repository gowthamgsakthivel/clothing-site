'use client'
import React from 'react'
import { useAppContext } from '@/context/AppContext'
import Loading from '@/components/Loading'
import OwnerLayout from '@/components/OwnerLayout'

const Layout = ({ children }) => {
  const { user } = useAppContext();

  if (user === undefined) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-medium mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access the owner dashboard.</p>
          <a href="/sign-in" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return <OwnerLayout>{children}</OwnerLayout>;
}

export default Layout
