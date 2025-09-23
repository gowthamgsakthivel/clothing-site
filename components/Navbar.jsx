"use client"
import React, { useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import SearchBar from "./SearchBar";
import DesignNotifications from "./DesignNotifications";
import StockNotificationIcon from "./StockNotificationIcon";

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
                <li className="flex items-center gap-2">
                  <DesignNotifications />
                  <StockNotificationIcon />
                </li>
                <li>
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')} />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
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
                  <div className="flex items-center gap-2">
                    <DesignNotifications />
                    {/* Removed duplicate StockNotificationIcon from mobile view */}
                  </div>
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