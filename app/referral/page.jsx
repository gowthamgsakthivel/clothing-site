'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

const ReferralPage = () => {
  const { user, router } = useAppContext();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referral');
      const data = await response.json();

      if (data.success) {
        setReferralData(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const copyReferralLink = async () => {
    const link = `${window.location.origin}/sign-up?ref=${referralData.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareReferral = (platform) => {
    const link = `${window.location.origin}/sign-up?ref=${referralData.referralCode}`;
    const text = `Join Sparrow Sports using my referral code ${referralData.referralCode} and get ₹100 off on your first order!`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view referrals</h2>
            <p className="text-gray-600 mb-6">Access your referral program and start earning rewards</p>
            <button
              onClick={() => router.push('/sign-in')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Refer Friends, Earn Rewards! 🎁
            </h1>
            <p className="text-lg text-gray-600">
              Share your referral code and earn ₹200 for each friend who signs up
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {referralData?.totalReferrals || 0}
              </div>
              <div className="text-sm text-gray-600">Total Referrals</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {referralData?.successfulReferrals || 0}
              </div>
              <div className="text-sm text-gray-600">Successful Orders</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ₹{referralData?.totalEarnings || 0}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₹{referralData?.availableBalance || 0}
              </div>
              <div className="text-sm text-gray-600">Available Balance</div>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Referral Code</h2>
              <p className="text-orange-100">Share this code with your friends</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
              <div className="text-4xl font-bold text-center mb-4 tracking-wider">
                {referralData?.referralCode}
              </div>
              <button
                onClick={copyReferralCode}
                className="w-full bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => shareReferral('whatsapp')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-sm font-medium">WhatsApp</span>
              </button>

              <button
                onClick={() => shareReferral('facebook')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>

              <button
                onClick={() => shareReferral('twitter')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-sm font-medium">Twitter</span>
              </button>

              <button
                onClick={copyReferralLink}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm font-medium">Copy Link</span>
              </button>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Share Your Code</h4>
                <p className="text-sm text-gray-600">Send your referral code to friends via WhatsApp, Facebook, or any social media</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Friend Signs Up</h4>
                <p className="text-sm text-gray-600">Your friend gets ₹100 bonus when they sign up using your code</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">You Earn ₹200</h4>
                <p className="text-sm text-gray-600">Get ₹200 instantly when your friend signs up, plus 5% commission on their first order</p>
              </div>
            </div>
          </div>

          {/* Recent Referrals */}
          {referralData?.referrals && referralData.referrals.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Referrals</h3>
              <div className="space-y-4">
                {referralData.referrals.slice(0, 5).map((referral, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-orange-600">
                          {referral.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{referral.userName}</div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(referral.signedUpAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {referral.hasCompletedOrder ? (
                        <div className="text-green-600 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Purchased
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">Pending order</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ReferralPage;
