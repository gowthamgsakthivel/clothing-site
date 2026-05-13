"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";

const NewsLetter = () => {
  const { user, isLoaded } = useUser();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signedInEmail = user?.primaryEmailAddress?.emailAddress || "";
  const canAutoSubscribe = Boolean(signedInEmail);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canAutoSubscribe && !email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post('/api/newsletter', {
        ...(canAutoSubscribe ? {} : { email }),
        source: 'homepage'
      });

      toast.success(data.message || 'Subscribed successfully');
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="md:text-4xl text-2xl font-medium">
        Stay ahead with Sparrow Sports
      </h1>
      {!isLoaded ? null : (
        <>
          <p className="md:text-base text-gray-500/80 pb-8">
            {canAutoSubscribe
              ? `We'll keep ${signedInEmail} updated with early access to new products and exclusive announcements.`
              : 'Get early access to new products, updates, and exclusive announcements before everyone else.'}
          </p>
          {canAutoSubscribe ? (
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
      ) : (
        <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
          <input
            className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500"
            type="email"
            placeholder="Enter your email id"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
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
