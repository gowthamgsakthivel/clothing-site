import React from "react";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-600">
      <div className="px-4 sm:px-6 md:px-12 lg:px-16 py-12 border-b border-gray-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Image
              src={assets.logo}
              alt="Sparrow Sports Logo"
              className="w-28"
            />
            <p className="mt-4 text-sm leading-relaxed">
              Sparrow Sports delivers premium sportswear designed for performance,
              comfort, and style. Perfect for individuals, teams, and bulk orders.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 mt-4">
              <a
                className="h-11 w-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition"
                href="#"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                className="h-11 w-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition"
                href="#"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                className="h-11 w-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition"
                href="#"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Company - Mobile Accordion */}
          <div className="lg:hidden">
            <details className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 flex items-center justify-between">
                Company
                <span className="text-gray-400">+</span>
              </summary>
              <ul className="px-4 pb-3 space-y-2 text-sm">
                <li><Link href="/" className="block py-2">Home</Link></li>
                <li><Link href="/about" className="block py-2">About Us</Link></li>
                <li><Link href="/all-products" className="block py-2">Products</Link></li>
                <li><Link href="/contact" className="block py-2">Contact</Link></li>
                <li><Link href="/privacy-policy" className="block py-2">Privacy Policy</Link></li>
              </ul>
            </details>
          </div>

          {/* Support - Mobile Accordion */}
          <div className="lg:hidden">
            <details className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 flex items-center justify-between">
                Support
                <span className="text-gray-400">+</span>
              </summary>
              <ul className="px-4 pb-3 space-y-2 text-sm">
                <li><Link href="/profile" className="block py-2">My Account</Link></li>
                <li><Link href="/orders" className="block py-2">Orders</Link></li>
                <li><Link href="/returns" className="block py-2">Returns</Link></li>
                <li><Link href="/faq" className="block py-2">FAQs</Link></li>
              </ul>
            </details>
          </div>

          {/* Company - Desktop */}
          <nav className="hidden lg:block" aria-label="Company">
            <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="block py-2">Home</Link></li>
              <li><Link href="/about" className="block py-2">About Us</Link></li>
              <li><Link href="/all-products" className="block py-2">Products</Link></li>
              <li><Link href="/contact" className="block py-2">Contact</Link></li>
              <li><Link href="/privacy-policy" className="block py-2">Privacy Policy</Link></li>
            </ul>
          </nav>

          {/* Support - Desktop */}
          <nav className="hidden lg:block" aria-label="Support">
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/profile" className="block py-2">My Account</Link></li>
              <li><Link href="/orders" className="block py-2">Orders</Link></li>
              <li><Link href="/returns" className="block py-2">Returns</Link></li>
              <li><Link href="/faq" className="block py-2">FAQs</Link></li>
            </ul>
          </nav>

          {/* Newsletter */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-3">
              Join Our Newsletter
            </h3>
            <p className="text-sm mb-4">
              Get updates on new arrivals and exclusive offers.
            </p>
            <form className="flex flex-col lg:flex-row gap-3" aria-label="Newsletter">
              <label className="sr-only" htmlFor="footer-email">Email</label>
              <input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                className="w-full h-11 px-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="submit"
                className="h-11 bg-gray-900 text-white px-5 rounded-md text-sm transition active:scale-95"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-12 lg:px-16 py-5 text-xs sm:text-sm text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} Sparrow Sports. All rights reserved.
          </p>
          <p>
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
