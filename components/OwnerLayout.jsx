'use client'
import React, { useCallback, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import {
  BarChart3, Bell, Boxes, LayoutDashboard, Menu,
  MessageSquare, Package, Palette, Plus, Search,
  ShoppingBag, Users, Star, Image as ImageIcon,
  ChevronLeft, Sparkles, Activity, ShieldCheck,
  PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react'

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
    { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, section: 'main', badge: null },
    { href: '/owner/analytics', label: 'Analytics', icon: BarChart3, section: 'main', badge: null },
    { href: '/owner/orders', label: 'Orders', icon: ShoppingBag, section: 'main', badge: null },
    { href: '/owner/inventory', label: 'Inventory', icon: Package, section: 'main', badge: null },
    { href: '/owner/products', label: 'Products', icon: Boxes, section: 'main', badge: null },
    { href: '/owner/add-product', label: 'Add Product', icon: Plus, section: 'main', badge: null },
    { href: '/owner/customers', label: 'Customers', icon: Users, section: 'main', badge: null },
    { href: '/owner/custom-designs', label: 'Custom Designs', icon: Palette, section: 'main', badge: 'Live' },
    { href: '/owner/reviews', label: 'Reviews', icon: Star, section: 'main', badge: null },
    { href: '/owner/featured-products', label: 'Featured Banner', icon: ImageIcon, section: 'main', badge: null },
    { href: '/owner/messages', label: 'Messages', icon: MessageSquare, section: 'system', badge: null }
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 text-sm md:text-base">
      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen w-full relative">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'w-20' : 'w-[270px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo & Store Header */}
          <div className="flex items-center justify-between px-4 h-20 shrink-0 border-b border-slate-100">
            <Link href="/owner" className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 transition-opacity duration-300">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-black text-slate-900 tracking-tight truncate">Sparrow Sports</h1>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">Pro</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Admin Panel
                  </p>
                </div>
              )}
            </Link>

            {/* Mobile Close X Button */}
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-6 px-3.5 py-5 overflow-y-auto scrollbar-none">
            <div>
              {!isCollapsed && (
                <p className="px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2.5">
                  Main Navigation
                </p>
              )}
              <div className="space-y-1.5">
                {mainItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { closeMobile(); }}
                      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${active
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5.5 bg-indigo-600 rounded-r-full" />
                      )}
                      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              {!isCollapsed && (
                <p className="px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2.5">
                  System & Comms
                </p>
              )}
              <div className="space-y-1.5">
                {systemItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { closeMobile(); }}
                      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${active
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5.5 bg-indigo-600 rounded-r-full" />
                      )}
                      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Bottom Admin User Pill */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className={`flex items-center gap-3 rounded-xl bg-white border border-slate-200/80 p-2.5 shadow-sm ${isCollapsed ? 'justify-center p-1.5' : ''}`}>
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail || 'admin@sparrow.com'}</p>
                </div>
              )}
              {!isCollapsed && (
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Workspace Wrapper */}
        <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[270px]'}`}>
          {/* Top Header Navbar */}
          <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm' : 'bg-white border-b border-slate-200/80'}`}>
            <div className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-8">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  className="inline-flex rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden transition-all border border-slate-200"
                  onClick={() => setIsMobileOpen(true)}
                  aria-label="Open sidebar drawer"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Desktop Sidebar Collapse Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                </button>

                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
                  <p className="text-sm font-semibold text-slate-500 hidden sm:flex items-center gap-1.5 mt-0.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Real-time admin metrics & store management</span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3">
                {/* Quick Search */}
                <div className="relative hidden md:block group">
                  <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-600" />
                  <input
                    type="text"
                    placeholder="Quick search orders, SKUs, buyers..."
                    className="w-64 lg:w-72 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <kbd className="hidden lg:inline-flex items-center justify-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-extrabold text-slate-400">⌘K</kbd>
                  </div>
                </div>

                {/* "+ Add Product" Action Trigger */}
                <Link
                  href="/owner/add-product"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Add Product</span>
                </Link>

                {/* Notifications Bell */}
                <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-200 bg-white shadow-sm">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                </button>

                {/* Admin User Badge */}
                <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pl-2 pr-3.5 text-sm text-slate-900 shadow-sm">
                  <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {userInitials}
                  </div>
                  <span className="font-extrabold text-slate-800">{userName.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main View Area */}
          <main className="flex-1 px-4 py-6 sm:px-8">
            <div className="mx-auto w-full max-w-7xl text-slate-900 text-sm md:text-base">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default OwnerLayout
