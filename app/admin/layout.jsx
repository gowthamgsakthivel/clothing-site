'use client'
import React from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const AdminLayout = ({ children }) => {
  const pathname = usePathname()

  const navigationItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/products/add', label: 'Add Product', icon: '➕' },
    { href: '/admin/products/manage-stock', label: 'Manage Stock', icon: '📦' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/orders', label: 'Orders', icon: '📋' },
    { href: '/admin/sellers', label: 'Sellers', icon: '🏪' },
    { href: '/admin/contacts', label: 'Messages', icon: '💬' },
  ]

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex w-full max-w-[100vw] overflow-x-hidden pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16 h-[calc(100vh-64px)]">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-600 mt-1">Manage your store</p>
          </div>

          <nav className="p-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${isActive(item.href)
                  ? 'bg-orange-50 text-orange-600 border-l-4 border-l-orange-600'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
