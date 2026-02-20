'use client'
import React, { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Palette,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  UserCircle,
  Users
} from 'lucide-react'

const OwnerLayout = ({ children }) => {
  const pathname = usePathname()
  const { user } = useAppContext()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const userName = user?.fullName || user?.username || 'Admin'
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''
  const userInitials = useMemo(() => {
    if (!userName) return 'AD'
    const parts = userName.trim().split(/\s+/)
    const initials = parts.slice(0, 2).map((part) => part[0]).join('')
    return initials.toUpperCase() || 'AD'
  }, [userName])

  const navigationItems = useMemo(() => ([
    { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { href: '/owner/analytics-v2', label: 'Analytics', icon: BarChart3, section: 'main' },
    { href: '/owner/orders-v2', label: 'Orders', icon: ShoppingBag, section: 'main' },
    { href: '/owner/inventory-v2', label: 'Inventory', icon: Package, section: 'main' },
    { href: '/owner/products', label: 'Products', icon: Boxes, section: 'main' },
    { href: '/owner/add-product', label: 'Add Product', icon: Plus, section: 'main' },
    { href: '/owner/customers', label: 'Customers', icon: Users, section: 'main' },
    { href: '/owner/custom-designs', label: 'Custom Designs', icon: Palette, section: 'main' },
    { href: '/owner/messages', label: 'Messages', icon: MessageSquare, section: 'system' },
    { href: '/owner/settings', label: 'Settings', icon: Settings, section: 'system' }
  ]), [])

  const isActive = useCallback((href) => {
    if (href === '/owner') {
      return pathname === '/owner'
    }
    return pathname.startsWith(href)
  }, [pathname])

  const pageTitle = useMemo(() => {
    const match = navigationItems.find((item) => isActive(item.href))
    return match?.label || 'Owner Panel'
  }, [isActive, navigationItems])

  const closeMobile = () => setIsMobileOpen(false)

  const mainItems = navigationItems.filter((item) => item.section === 'main')
  const systemItems = navigationItems.filter((item) => item.section === 'system')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-h-screen w-full overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-y-auto border-r border-slate-200 bg-white transition-all duration-200 ${
            isCollapsed ? 'w-20' : 'w-72'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              SP
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-slate-900">Sparrow Sports</h1>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
              </div>
            )}
            <button
              type="button"
              className="ml-auto hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:inline-flex"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-4 px-3 py-4">
            <div>
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Main</p>
              )}
              <div className="mt-2 space-y-1">
                {mainItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">System</p>
              )}
              <div className="mt-2 space-y-1">
                {systemItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail || 'admin@sparrow.com'}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className={`flex min-h-screen flex-1 flex-col ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
            <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                  onClick={() => setIsMobileOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
                  <p className="text-xs text-slate-500">Welcome back, here is your workspace.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative hidden sm:block">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-60 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <UserCircle className="h-5 w-5 text-slate-500" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default OwnerLayout
