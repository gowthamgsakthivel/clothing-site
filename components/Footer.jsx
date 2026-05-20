"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import { Facebook, Instagram, Twitter, ChevronDown } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const Footer = () => {
  const { user, isLoaded } = useUser();
  const [openSection, setOpenSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const signedInEmail = user?.primaryEmailAddress?.emailAddress || "";
  const canAutoSubscribe = Boolean(signedInEmail);

  // Check subscription status on mount for logged-in users
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!isLoaded || !canAutoSubscribe) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const { data } = await axios.get('/api/newsletter');
        setIsSubscribed(data.isSubscribed || false);
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setIsSubscribed(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSubscriptionStatus();
  }, [isLoaded, canAutoSubscribe]);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const { data } = await axios.post('/api/newsletter', {
        source: 'footer'
      });

      toast.success('Subscribed successfully!');
      setIsSubscribed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-50 text-gray-700">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-6 md:gap-y-12 gap-x-8 mb-10">
            {/* Brand Section */}
            <div className="col-span-2 md:col-span-1 md:border-0 md:bg-transparent md:p-0">
              <div className="inline-flex items-center border-l-2 border-orange-500 pl-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 mb-4">
                Sparrow Sports
              </div>
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
                  href="https://facebook.com/sparrowsports"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook size={18} />
                </a>
                <a
                  className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 transition"
                  href="https://instagram.com/sparrowsports"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={18} />
                </a>
                <a
                  className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 transition"
                  href="https://twitter.com/sparrowsports"
                  aria-label="Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter size={18} />
                </a>
              </div>
            </div>

            {/* Company Links (mobile accordion) */}
            <nav aria-label="Company" className="col-span-2 md:col-span-1 border-t border-gray-200 pt-4 md:border-0 md:pt-0">
              <div className="md:block">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'company' ? null : 'company')}
                  className={`md:hidden w-full flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.18em] mb-0 py-3 px-0 transition-all ${openSection === 'company' ? 'text-gray-900' : 'text-gray-800'}`}
                  aria-expanded={openSection === 'company'}
                >
                  <span>Company</span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${openSection === 'company' ? 'rotate-180 text-orange-600' : 'text-gray-500'}`} />
                </button>

                <h4 className="hidden md:block text-gray-900 font-extrabold text-sm mb-5 uppercase tracking-[0.18em]">Company</h4>
                <div className={`overflow-hidden transition-[max-height,margin-left] duration-300 ${openSection === 'company' ? 'max-h-96 mt-2 ml-4 md:ml-0' : 'max-h-0 ml-0'} md:max-h-full`}>
                  <ul className="space-y-2 text-sm py-2 md:py-1">
                    <li><Link href="/" className="text-gray-600 hover:text-orange-500 transition font-medium">Home</Link></li>
                    <li><Link href="/about" className="text-gray-600 hover:text-orange-500 transition font-medium">About</Link></li>
                    <li><Link href="/all-products" className="text-gray-600 hover:text-orange-500 transition font-medium">Products</Link></li>
                    <li><Link href="/sports" className="text-gray-600 hover:text-orange-500 transition font-medium">Sports</Link></li>
                    <li><Link href="/devotional" className="text-gray-600 hover:text-orange-500 transition font-medium">Devotional</Link></li>
                  </ul>
                </div>
              </div>
            </nav>

            {/* Support Links (mobile accordion) */}
            <nav aria-label="Support" className="col-span-2 md:col-span-1 border-t border-gray-200 pt-4 md:border-0 md:pt-0">
              <div className="md:block">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'support' ? null : 'support')}
                  className={`md:hidden w-full flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.18em] mb-0 py-3 px-0 transition-all ${openSection === 'support' ? 'text-gray-900' : 'text-gray-800'}`}
                  aria-expanded={openSection === 'support'}
                >
                  <span>Support</span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${openSection === 'support' ? 'rotate-180 text-orange-600' : 'text-gray-500'}`} />
                </button>

                <h4 className="hidden md:block text-gray-900 font-extrabold text-sm mb-5 uppercase tracking-[0.18em]">Support</h4>
                <div className={`overflow-hidden transition-[max-height,margin-left] duration-300 ${openSection === 'support' ? 'max-h-96 mt-2 ml-4 md:ml-0' : 'max-h-0 ml-0'} md:max-h-full`}>
                  <ul className="space-y-2 text-sm py-2 md:py-1">
                    <li><Link href="/profile" className="text-gray-600 hover:text-orange-500 transition font-medium">My Account</Link></li>
                    <li><Link href="/orders" className="text-gray-600 hover:text-orange-500 transition font-medium">Orders</Link></li>
                    <li><Link href="/returns" className="text-gray-600 hover:text-orange-500 transition font-medium">Returns</Link></li>
                    <li><Link href="/faq" className="text-gray-600 hover:text-orange-500 transition font-medium">FAQs</Link></li>
                    <li><Link href="/contact" className="text-gray-600 hover:text-orange-500 transition font-medium">Contact</Link></li>
                  </ul>
                </div>
              </div>
            </nav>

            {/* Legal Links (mobile accordion) */}
            <nav aria-label="Legal" className="col-span-2 md:col-span-1 border-t border-gray-200 pt-4 md:border-0 md:pt-0">
              <div className="md:block">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'legal' ? null : 'legal')}
                  className={`md:hidden w-full flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.18em] mb-0 py-3 px-0 transition-all ${openSection === 'legal' ? 'text-gray-900' : 'text-gray-800'}`}
                  aria-expanded={openSection === 'legal'}
                >
                  <span>Legal</span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${openSection === 'legal' ? 'rotate-180 text-orange-600' : 'text-gray-500'}`} />
                </button>

                <h4 className="hidden md:block text-gray-900 font-extrabold text-sm mb-5 uppercase tracking-[0.18em]">Legal</h4>
                <div className={`overflow-hidden transition-[max-height,margin-left] duration-300 ${openSection === 'legal' ? 'max-h-96 mt-2 ml-4 md:ml-0' : 'max-h-0 ml-0'} md:max-h-full`}>
                  <ul className="space-y-2 text-sm py-2 md:py-1">
                    <li><Link href="/privacy-policy" className="text-gray-600 hover:text-orange-500 transition font-medium">Privacy Policy</Link></li>
                    <li><Link href="/terms-conditions" className="text-gray-600 hover:text-orange-500 transition font-medium">Terms & Conditions</Link></li>
                    <li><Link href="/shipping-policy" className="text-gray-600 hover:text-orange-500 transition font-medium">Shipping Policy</Link></li>
                    <li><Link href="/returns-policy" className="text-gray-600 hover:text-orange-500 transition font-medium">Returns Policy</Link></li>
                  </ul>
                </div>
              </div>
            </nav>

            {/* Newsletter (mobile controlled accordion) */}
            <div className="col-span-2 md:col-span-1 border-t border-gray-200 pt-4 md:border-0 md:pt-0">
              <div className="md:block">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'newsletter' ? null : 'newsletter')}
                  className={`md:hidden w-full flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.18em] mb-0 py-3 px-0 transition-all ${openSection === 'newsletter' ? 'text-gray-900' : 'text-gray-800'}`}
                  aria-expanded={openSection === 'newsletter'}
                >
                  <span>Newsletter</span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${openSection === 'newsletter' ? 'rotate-180 text-orange-600' : 'text-gray-500'}`} />
                </button>

                <h4 className="hidden md:block text-gray-900 font-extrabold text-sm mb-5 uppercase tracking-[0.18em]">Newsletter</h4>
                <div className={`overflow-hidden transition-[max-height,margin-left] duration-300 ${openSection === 'newsletter' ? 'max-h-80 mt-2 ml-4 md:ml-0' : 'max-h-0 ml-0'} md:max-h-full`}>
                  {!isLoaded || isCheckingStatus ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : (
                    <>
                      {isSubscribed ? (
                        <div className="text-sm border-l-2 border-emerald-500 pl-4 py-1">
                          <p className="text-emerald-600 font-medium mb-2">✓ You&apos;re subscribed!</p>
                          <p className="text-gray-600 text-xs">We&apos;ll send updates to {signedInEmail}</p>
                        </div>
                      ) : (
                        <>
                          <div className="border border-gray-200 bg-gray-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 mb-2">
                              Stay in the loop
                            </p>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                              Get early drops, offers, and match-day updates in one place.
                            </p>
                            <form className="flex flex-col gap-2.5" aria-label="Newsletter" onSubmit={handleNewsletterSubmit}>
                              <input
                                type="email"
                                value={signedInEmail}
                                readOnly
                                className="w-full px-4 py-3 bg-white text-gray-800 border border-gray-300 rounded-lg text-sm focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-orange-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-orange-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                              </button>
                            </form>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
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
