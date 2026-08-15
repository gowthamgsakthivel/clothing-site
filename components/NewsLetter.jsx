"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail, CheckCircle2, Sparkles, Send } from "lucide-react";

const NewsLetter = () => {
  const { user, isLoaded } = useUser();
  const [emailInput, setEmailInput] = useState("");
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetEmail = signedInEmail || emailInput;

    if (!targetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post('/api/newsletter', {
        email: targetEmail,
        source: 'homepage'
      });

      toast.success('Subscribed to VIP club!');
      setIsSubscribed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hide component if logged-in user is already subscribed
  if (isLoaded && canAutoSubscribe && isCheckingStatus === false && isSubscribed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-orange-50/80 via-amber-50/40 to-stone-50 border border-orange-100/90 text-slate-900 my-8 sm:my-12 md:my-14 p-5 sm:p-8 md:p-12 text-center shadow-sm">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/90 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          VIP Club Early Access
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
          Join the Sparrow Athletes Club
        </h2>

        <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-2 max-w-lg leading-relaxed">
          Be the first to unlock exclusive drops, athlete discounts, custom jersey launches, and tournament gear.
        </p>

        {isSubscribed ? (
          <div className="mt-5 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-emerald-800 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>You&apos;re in! We&apos;ll notify {signedInEmail || emailInput} for upcoming VIP drops.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={signedInEmail || emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                readOnly={Boolean(signedInEmail)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-sm rounded-full shadow-lg shadow-orange-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 cursor-pointer"
            >
              <span>{isSubmitting ? 'Joining...' : 'Subscribe'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsLetter;
