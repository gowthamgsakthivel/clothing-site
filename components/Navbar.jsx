"use client"
import React, { useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import SearchBar from "./SearchBar";
import UnifiedNotificationIcon from "./UnifiedNotificationIcon";
import CartCounter from "./CartIcon";

const Navbar = () => {

  const { isSeller, isAdmin, router, user } = useAppContext();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { openSignIn } = useClerk();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700 bg-white">
        <Image
          className="cursor-pointer w-28 md:w-32"
          onClick={() => router.push('/')}
          src={assets.logo}
          alt="logo"
        />
        <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
          <Link href="/" className="hover:text-gray-900 transition">
            Home
          </Link>
          <Link href="/all-products" className="hover:text-gray-900 transition">
            Products
          </Link>
          <Link href="/about" className="hover:text-gray-900 transition">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-gray-900 transition">
            Contact
          </Link>

          {(isAdmin || isSeller) && (
            <Link href="/owner" className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-100 cursor-pointer inline-block">
              Owner Dashboard
            </Link>
          )}

        </div>

        <ul className="hidden md:flex items-center gap-4">
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
                    {(isAdmin || isSeller) && (
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
                      <UserButton.Action label="Track Order" labelIcon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 0 1-1 1.42V21a1 1 0 0 1-2 0v-1.08a1.5 1.5 0 0 1 0-2.84V7.5a1.5 1.5 0 0 1 3 0v9.58a1.5 1.5 0 0 1 1 1.42z M7 4a1.5 1.5 0 0 0-1 1.42V7a1 1 0 0 0 2 0V5.42A1.5 1.5 0 0 0 7 4z" /></svg>} onClick={() => router.push('/track-order')} />
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
                    {(isAdmin || isSeller) && (
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

        {/* Mobile menu drawer */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="fixed top-[60px] left-0 right-0 bg-white z-50 md:hidden border-b shadow-lg max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="px-4 py-3">
                <SearchBar showResultsInline={false} />
              </div>
              <div className="py-2">
                {(isAdmin || isSeller) && (
                  <Link
                    href="/owner"
                    className="flex items-center gap-3 px-6 py-3 bg-orange-50 text-orange-700 hover:bg-orange-100 active:bg-orange-200 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <HomeIcon />
                    <span className="font-medium">Owner Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <HomeIcon />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  href="/all-products"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BoxIcon />
                  <span className="font-medium">Products</span>
                </Link>
                <Link
                  href="/my-orders"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BagIcon />
                  <span className="font-medium">My Orders</span>
                </Link>
                <Link
                  href="/track-order"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 18.5a1.5 1.5 0 0 1-1 1.42V21a1 1 0 0 1-2 0v-1.08a1.5 1.5 0 0 1 0-2.84V7.5a1.5 1.5 0 0 1 3 0v9.58a1.5 1.5 0 0 1 1 1.42z" />
                  </svg>
                  <span className="font-medium">Track Order</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" />
                  </svg>
                  <span className="font-medium">Wishlist</span>
                </Link>
                <Link
                  href="/custom-design"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-medium">Custom Designs</span>
                </Link>
                <Link
                  href="/my-designs"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BagIcon />
                  <span className="font-medium">My Designs</span>
                </Link>
                <Link
                  href="/returns"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
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
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <span className="font-medium">About Us</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
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

      {/* Mobile bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 pb-safe">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition min-w-[60px]"
          >
            <HomeIcon />
            <span className="text-xs text-gray-600">Home</span>
          </Link>

          <Link
            href="/all-products"
            className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition min-w-[60px]"
          >
            <BoxIcon />
            <span className="text-xs text-gray-600">Shop</span>
          </Link>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition min-w-[60px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs text-gray-600">Search</span>
          </button>

          <Link
            href="/cart"
            className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition min-w-[60px] relative"
          >
            <CartIcon />
            <span className="text-xs text-gray-600">Cart</span>
          </Link>

          <Link
            href="/my-orders"
            className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition min-w-[60px]"
          >
            <BagIcon />
            <span className="text-xs text-gray-600">Orders</span>
          </Link>
        </div>
      </div>

      {/* Mobile search bar that appears when search icon is clicked */}
      {showSearch && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-white px-4 py-3 border-b shadow-lg z-40">
          <div className="flex items-center gap-2">
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