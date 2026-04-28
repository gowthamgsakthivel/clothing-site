"use client"
import React, { useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import UnifiedNotificationIcon from "./UnifiedNotificationIcon";
import CartCounter from "./CartIcon";

const Navbar = () => {

  const { isAdmin, router, user } = useAppContext();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { openSignIn } = useClerk();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 text-gray-700 bg-white/80 backdrop-blur-md pl-4">
        <div className="flex w-full items-center px-3 sm:px-4 lg:px-6 py-3">
          <Image
            className="cursor-pointer w-24 md:w-28 shrink-0 ml-4 md:ml-6"
            onClick={() => router.push('/')}
            src={assets.logo}
            alt="logo"
          />
          <div className="flex items-center gap-4 lg:gap-8 max-md:hidden ml-4 lg:ml-6">
            <Link href="/" className={`transition ${isActive('/') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              Home
            </Link>
            <Link href="/all-products" className={`transition ${isActive('/all-products') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              Products
            </Link>
            <Link href="/sports" className={`transition ${isActive('/sports') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              Sports
            </Link>
            <Link href="/devotional" className={`transition ${isActive('/devotional') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              Devotional
            </Link>
            <Link href="/political" className={`transition ${isActive('/political') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              Political
            </Link>
            <Link href="/about" className={`transition ${isActive('/about') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              About Us
            </Link>
            <Link href="/contact" className={`transition ${isActive('/contact') ? 'text-orange-600 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}>
              Contact
            </Link>

            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push('/owner')}
                className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-100 cursor-pointer inline-block"
              >
                Owner Dashboard
              </button>
            )}

          </div>

          <ul className="hidden md:flex items-center gap-4 ml-auto">
            <li className="min-w-[240px]">
              <SearchBar showResultsInline={true} />
            </li>
            {
              user
                ? <>
                  <li>
                    <UnifiedNotificationIcon />
                  </li>
                  <li>
                    <CartCounter />
                  </li>
                  <li>
                    <UserButton>
                      <UserButton.MenuItems>
                        <UserButton.Action label="My Profile" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>} onClick={() => router.push('/profile')} />
                      </UserButton.MenuItems>
                      {isAdmin && (
                        <UserButton.MenuItems>
                          <UserButton.Action label="Owner Dashboard" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z" /></svg>} onClick={() => router.push('/owner')} />
                        </UserButton.MenuItems>
                      )}
                      <UserButton.MenuItems>
                        <UserButton.Action label="Wishlist" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" /></svg>} onClick={() => router.push('/wishlist')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="Returns & Refunds" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" /></svg>} onClick={() => router.push('/returns')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="Custom Designs" labelIcon={<BoxIcon />} onClick={() => router.push('/custom-design')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="My Designs" labelIcon={<BagIcon />} onClick={() => router.push('/my-designs')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="Stock Notifications" labelIcon={<BagIcon />} onClick={() => router.push('/notifications')} />
                      </UserButton.MenuItems>
                    </UserButton>
                  </li>
                </>
                : <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
                  <Image src={assets.user_icon} alt="user icon" />
                  Account
                </button>
            }
          </ul>

          <div className="flex items-center md:hidden gap-3">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Menu"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {
              user
                ? <>
                  <div className="flex items-center gap-2">
                    <UnifiedNotificationIcon />
                    <CartCounter />
                    <UserButton>
                      <UserButton.MenuItems>
                        <UserButton.Action label="My Profile" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>} onClick={() => router.push('/profile')} />
                      </UserButton.MenuItems>
                      {isAdmin && (
                        <UserButton.MenuItems>
                          <UserButton.Action label="Owner Dashboard" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z" /></svg>} onClick={() => router.push('/owner')} />
                        </UserButton.MenuItems>
                      )}
                      <UserButton.MenuItems>
                        <UserButton.Action label="Wishlist" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" /></svg>} onClick={() => router.push('/wishlist')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="Returns & Refunds" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" /></svg>} onClick={() => router.push('/returns')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="My Designs" labelIcon={<BagIcon />} onClick={() => router.push('/my-designs')} />
                      </UserButton.MenuItems>
                      <UserButton.MenuItems>
                        <UserButton.Action label="Stock Notifications" labelIcon={<BagIcon />} onClick={() => router.push('/notifications')} />
                      </UserButton.MenuItems>
                    </UserButton>
                  </div>
                </>
                : <button onClick={openSignIn} className="flex items-center gap-2 text-sm hover:text-gray-900 transition">
                  <Image src={assets.user_icon} alt="user icon" className="w-5 h-5" />
                </button>
            }
          </div>
        </div>

        {/* Mobile menu drawer */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="fixed top-[60px] left-0 right-0 bg-white/95 backdrop-blur-md z-50 md:hidden border-b border-gray-200/50 shadow-xl max-h-[calc(100vh-120px)] overflow-y-auto w-full rounded-b-2xl">
              <div className="px-4 py-4">
                <SearchBar showResultsInline={false} />
              </div>
              <div className="py-2">
                {isAdmin && (
                  <Link
                    href="/owner"
                    className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <HomeIcon />
                    <span className="font-medium">Owner Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/') && pathname === '/' ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <HomeIcon />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  href="/all-products"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/all-products') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BoxIcon />
                  <span className="font-medium">Products</span>
                </Link>
                <Link
                  href="/sports"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/sports') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BoxIcon />
                  <span className="font-medium">Sports</span>
                </Link>
                <Link
                  href="/devotional"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/devotional') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BoxIcon />
                  <span className="font-medium">Devotional</span>
                </Link>
                <Link
                  href="/political"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/political') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BoxIcon />
                  <span className="font-medium">Political</span>
                </Link>
                <Link
                  href="/my-orders"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/my-orders') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BagIcon />
                  <span className="font-medium">My Orders</span>
                </Link>
                <Link
                  href="/wishlist"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/wishlist') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" />
                  </svg>
                  <span className="font-medium">Wishlist</span>
                </Link>
                <Link
                  href="/custom-design"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/custom-design') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-medium">Custom Designs</span>
                </Link>
                <Link
                  href="/my-designs"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/my-designs') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BagIcon />
                  <span className="font-medium">My Designs</span>
                </Link>
                <Link
                  href="/returns"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/returns') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                  </svg>
                  <span className="font-medium">Returns & Refunds</span>
                </Link>

                <div className="border-t my-2" />

                <Link
                  href="/about"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/about') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <span className="font-medium">About Us</span>
                </Link>
                <Link
                  href="/contact"
                  className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/contact') ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span className="font-medium">Contact</span>
                </Link>
              </div>
            </div>
          </>
        )}

      </nav>

      {/* Mobile bottom navigation bar - Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 md:hidden z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-2 px-1">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition min-w-[60px] ${isActive('/') && pathname === '/' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <HomeIcon />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            href="/all-products"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition min-w-[60px] ${isActive('/all-products') ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <BoxIcon />
            <span className="text-xs font-medium">Shop</span>
          </Link>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition min-w-[60px] text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">Search</span>
          </button>

          <Link
            href="/cart"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition min-w-[60px] relative ${isActive('/cart') ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <CartIcon />
            <span className="text-xs font-medium">Cart</span>
          </Link>

          <Link
            href="/my-orders"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition min-w-[60px] ${isActive('/my-orders') ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <BagIcon />
            <span className="text-xs font-medium">Orders</span>
          </Link>
        </div>
      </div>

      {/* Mobile search bar that appears when search icon is clicked */}
      {showSearch && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-white/90 backdrop-blur-md px-4 py-4 border-b border-gray-200/50 shadow-lg z-40 rounded-b-2xl animate-fade-in-down">
          <div className="flex items-center gap-3">
            <SearchBar showResultsInline={false} />
            <button
              onClick={() => setShowSearch(false)}
              className="text-gray-600 hover:text-gray-900 px-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;