"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";

const NewsLetter = () => {
  const { user, isLoaded } = useUser();
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

    setIsSubmitting(true);

    try {
      const { data } = await axios.post('/api/newsletter', {
        source: 'homepage'
      });

      toast.success('Subscribed successfully!');
      setIsSubscribed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hide component if user is already subscribed
  if (isLoaded && canAutoSubscribe && isCheckingStatus === false && isSubscribed) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="md:text-4xl text-2xl font-medium">
        Stay ahead with Sparrow Sports
      </h1>
      {!isLoaded || isCheckingStatus ? null : (
        <>
          <p className="md:text-base text-gray-500/80 pb-8">
            We&apos;ll keep {signedInEmail} updated with early access to new products and exclusive announcements.
          </p>
          {isSubscribed ? (
            <div className="text-center">
              <p className="text-emerald-600 font-medium mb-2">✓ You&apos;re subscribed!</p>
              <p className="text-sm text-gray-600">We&apos;ll send updates to {signedInEmail}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
              <div className="flex h-full w-full items-center rounded-md border border-gray-500/30 bg-gray-50 px-3 text-left text-sm text-gray-600">
                {signedInEmail}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="md:px-12 px-8 h-full text-white bg-orange-600 rounded-md rounded-l-none disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          )}
        </>
      )}
    </form>
  );
};

export default NewsLetter;
