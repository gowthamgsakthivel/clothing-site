import React from "react";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-700">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            {/* Brand Section */}
            <div className="col-span-2 md:col-span-1">
              <Image
                src={assets.logo}
                alt="Sparrow Sports Logo"
                className="w-32 mb-4"
              />
              <p className="text-sm leading-relaxed text-gray-600 mb-5">
                Premium sportswear for champions.
              </p>
              <div className="flex gap-3">
                <a
                  className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 transition"
                  href="#"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 transition"
                  href="#"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 transition"
                  href="#"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
              </div>
            </div>

            {/* Company Links */}
            <nav aria-label="Company" className="col-span-1">
              <h4 className="text-gray-900 font-bold text-sm mb-5 uppercase tracking-wide">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-gray-600 hover:text-orange-500 transition font-medium">Home</Link></li>
                <li><Link href="/about" className="text-gray-600 hover:text-orange-500 transition font-medium">About</Link></li>
                <li><Link href="/all-products" className="text-gray-600 hover:text-orange-500 transition font-medium">Products</Link></li>
                <li><Link href="/sports" className="text-gray-600 hover:text-orange-500 transition font-medium">Sports</Link></li>
                <li><Link href="/devotional" className="text-gray-600 hover:text-orange-500 transition font-medium">Devotional</Link></li>
              </ul>
            </nav>

            {/* Support Links */}
            <nav aria-label="Support" className="col-span-1">
              <h4 className="text-gray-900 font-bold text-sm mb-5 uppercase tracking-wide">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/profile" className="text-gray-600 hover:text-orange-500 transition font-medium">My Account</Link></li>
                <li><Link href="/orders" className="text-gray-600 hover:text-orange-500 transition font-medium">Orders</Link></li>
                <li><Link href="/returns" className="text-gray-600 hover:text-orange-500 transition font-medium">Returns</Link></li>
                <li><Link href="/faq" className="text-gray-600 hover:text-orange-500 transition font-medium">FAQs</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-orange-500 transition font-medium">Contact</Link></li>
              </ul>
            </nav>

            {/* Newsletter */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-gray-900 font-bold text-sm mb-5 uppercase tracking-wide">Newsletter</h4>
              <p className="text-sm text-gray-600 mb-4">
                Subscribe for exclusive deals
              </p>
              <form className="flex flex-col gap-2.5" aria-label="Newsletter">
                <label className="sr-only" htmlFor="footer-email">Email</label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition"
                />
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-orange-700 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-10"></div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <p>© {new Date().getFullYear()} Sparrow Sports. All rights reserved.</p>
            <p>Made with <span className="text-orange-600">❤</span> in India</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
