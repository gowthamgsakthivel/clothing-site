'use client'
import React from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const OwnerLayout = ({ children }) => {
  const pathname = usePathname()

  const navigationItems = [
    { href: '/owner', label: 'Dashboard', icon: '📊' },
    { href: '/owner/products', label: 'Products', icon: '🛍️' },
    { href: '/owner/add-product', label: 'Add Product', icon: '➕' },
    { href: '/owner/inventory', label: 'Inventory', icon: '📦' },
    { href: '/owner/orders', label: 'Orders', icon: '📋' },
    { href: '/owner/custom-designs', label: 'Custom Designs', icon: '🎨' },
    { href: '/owner/customers', label: 'Customers', icon: '👥' },
    { href: '/owner/messages', label: 'Messages', icon: '💬' },
  ]

  const isActive = (href) => {
    if (href === '/owner') {
      return pathname === '/owner'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex w-full max-w-[100vw] overflow-x-hidden pt-16">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16 h-[calc(100vh-64px)]">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Owner Panel</h2>
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

        <main className="flex-1 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default OwnerLayout
