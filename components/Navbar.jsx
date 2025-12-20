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

  const { isSeller, router, user } = useAppContext();
  const [showSearch, setShowSearch] = useState(false);
  const { openSignIn } = useClerk();

  return (
    <>
      <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
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

          {isSeller && <button onClick={() => router.push('/seller')} className="text-xs border px-4 py-1.5 rounded-full">Seller Dashboard</button>}

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
            className="flex items-center"
            aria-label="Search"
            onClick={() => setShowSearch((v) => !v)}
            type="button"
          >
            <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />
          </button>
          {isSeller && <button onClick={() => router.push('/seller')} className="text-xs border px-4 py-1.5 rounded-full">Seller Dashboard</button>}
          {
            user
              ? <>
                <div className="flex items-center gap-3">
                  <UnifiedNotificationIcon />
                  <CartCounter />
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action label="Home" labelIcon={<HomeIcon />} onClick={() => router.push('/')} />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action label="Products" labelIcon={<BoxIcon />} onClick={() => router.push('/all-products')} />
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
                </div>
              </>
              : <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
                <Image src={assets.user_icon} alt="user icon" />
                Account
              </button>
          }
        </div>
      </nav>

      {/* Mobile search bar that appears when search icon is clicked */}
      {showSearch && (
        <div className="md:hidden px-6 py-3 border-b">
          <SearchBar />
        </div>
      )}
    </>
  );
};

export default Navbar;