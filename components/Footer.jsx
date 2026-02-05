import React from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-600">
      {/* Top Section */}
      <div className="px-6 md:px-16 lg:px-32 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-gray-200">

        {/* Brand */}
        <div>
          <Image
            src={assets.logo}
            alt="Sparrow Sports Logo"
            className="w-28"
          />
          <p className="mt-5 text-sm leading-relaxed">
            Sparrow Sports delivers premium sportswear designed for performance,
            comfort, and style. Perfect for individuals, teams, and bulk orders.
          </p>

          {/* Social Icons */}
          <div className="flex gap-4 mt-5">
            <a className="hover:text-gray-900 transition" href="#">
              <Facebook size={18} />
            </a>
            <a className="hover:text-gray-900 transition" href="#">
              <Instagram size={18} />
            </a>
            <a className="hover:text-gray-900 transition" href="#">
              <Twitter size={18} />
            </a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-gray-900">Home</a></li>
            <li><a href="/about" className="hover:text-gray-900">About Us</a></li>
            <li><a href="/all-products" className="hover:text-gray-900">Products</a></li>
            <li><a href="/contact" className="hover:text-gray-900">Contact</a></li>
            <li><a href="/privacy-policy" className="hover:text-gray-900">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/profile" className="hover:text-gray-900">My Account</a></li>
            <li><a href="/orders" className="hover:text-gray-900">Orders</a></li>
            <li><a href="/returns" className="hover:text-gray-900">Returns</a></li>
            <li><a href="/faq" className="hover:text-gray-900">FAQs</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-4">
            Join Our Newsletter
          </h3>
          <p className="text-sm mb-4">
            Get updates on new arrivals and exclusive offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm hover:bg-gray-800 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 md:px-16 lg:px-32 py-5 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} Sparrow Sports. All rights reserved.
        </p>
        <p className="mt-2 sm:mt-0">
          Made with ❤️ in India
        </p>
      </div>
    </footer>
  );
};

export default Footer;
