'use client'
import React, { useCallback, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import {
  BarChart3, Bell, Boxes, ChevronDown, LayoutDashboard, Menu,
  MessageSquare, Package, Palette, Plus, Search, Settings,
  ShoppingBag, UserCircle, Users, LogOut
} from 'lucide-react'
import { Star, Image } from 'lucide-react'

const OwnerLayout = ({ children }) => {
  const pathname = usePathname()
  const { user } = useAppContext()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    { href: '/owner/analytics', label: 'Analytics', icon: BarChart3, section: 'main' },
    { href: '/owner/orders', label: 'Orders', icon: ShoppingBag, section: 'main' },
    { href: '/owner/inventory', label: 'Inventory', icon: Package, section: 'main' },
    { href: '/owner/products', label: 'Products', icon: Boxes, section: 'main' },
    { href: '/owner/add-product', label: 'Add Product', icon: Plus, section: 'main' },
    { href: '/owner/customers', label: 'Customers', icon: Users, section: 'main' },
    { href: '/owner/custom-designs', label: 'Custom Designs', icon: Palette, section: 'main' },
    { href: '/owner/reviews', label: 'Reviews', icon: Star, section: 'main' },
    { href: '/owner/asset-controls', label: 'Asset Controls', icon: Image, section: 'main' },
    { href: '/owner/messages', label: 'Messages', icon: MessageSquare, section: 'system' },
    { href: '/owner/settings', label: 'Settings', icon: Settings, section: 'system' }
  ]), [])

  const isActive = useCallback((href) => {
    if (href === '/owner') return pathname === '/owner'
    return pathname.startsWith(href)
  }, [pathname])

  const pageTitle = useMemo(() => {
    const match = navigationItems.find((item) => isActive(item.href))
    return match?.label || 'Overview'
  }, [isActive, navigationItems])

  const closeMobile = () => setIsMobileOpen(false)

  const mainItems = navigationItems.filter((item) => item.section === 'main')
  const systemItems = navigationItems.filter((item) => item.section === 'system')

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Floating Add button removed per user request */}
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen w-full overflow-hidden">
        {/* Floating collapse/expand toggle positioned just outside the sidebar (left edge of content) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={isCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center fixed top-6 z-[9999] rounded-full bg-white border border-slate-200 shadow-sm w-9 h-9 text-slate-700 hover:bg-slate-50 transition-all"
          style={{ left: isCollapsed ? '80px' : '280px' }}
        >
          <span className="text-base font-semibold select-none">{isCollapsed ? '>' : '<'}</span>
        </button>
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-y-auto bg-white/70 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'w-20' : 'w-[280px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-6 h-20 shrink-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200">
              <span className="font-bold text-sm tracking-wider">SP</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 opacity-100 transition-opacity duration-300">
                <h1 className="text-base font-bold text-slate-800 tracking-tight truncate">Sparrow Sports</h1>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest truncate">Admin Portal</p>
              </div>
            )}
            {/* Inline logo-area toggle removed; using floating left-edge toggle instead */}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 px-4 py-4 overflow-y-auto scrollbar-hide">
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Main Navigation</p>
              )}
              <div className="space-y-1">
                {mainItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { closeMobile(); if (isCollapsed) setIsCollapsed(false); }}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${active
                          ? 'bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">System</p>
              )}
              <div className="space-y-1">
                {systemItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { closeMobile(); if (isCollapsed) setIsCollapsed(false); }}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${active
                          ? 'bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 mt-auto">
            <div className={`flex items-center gap-3 rounded-2xl bg-white border border-slate-200/60 p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300/60 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700">
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">{userEmail || 'admin@sparrow.com'}</p>
                </div>
              )}
              {!isCollapsed && (
                <LogOut className="w-4 h-4 text-slate-400 hover:text-slate-600 shrink-0" />
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
          {/* Header */}
          <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm' : 'bg-transparent border-transparent'}`}>
            <div className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="inline-flex rounded-xl p-2 text-slate-500 hover:bg-white hover:shadow-sm lg:hidden transition-all"
                  onClick={() => setIsMobileOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
                  <p className="text-xs font-medium text-slate-500 mt-0.5 hidden sm:block">Here is what is happening with your business today.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Header inline toggle removed; using floating left-edge toggle instead */}
                <div className="relative hidden md:block group">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500" />
                  <input
                    type="text"
                    placeholder="Search orders, clients..."
                    className="w-64 rounded-xl border border-slate-200/80 bg-white/50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <kbd className="hidden lg:inline-flex items-center justify-center rounded border border-slate-200 px-1.5 text-[10px] font-medium text-slate-400">⌘</kbd>
                    <kbd className="hidden lg:inline-flex items-center justify-center rounded border border-slate-200 px-1.5 text-[10px] font-medium text-slate-400">K</kbd>
                  </div>
                </div>

                <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-700 transition-all">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                <button className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1 pl-2 pr-3 text-sm text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {userInitials}
                  </div>
                  <span className="font-semibold">{userName.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 px-4 py-8 sm:px-8">
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
