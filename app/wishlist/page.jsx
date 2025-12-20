"use client";
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SEOMetadata from '@/components/SEOMetadata';
import Loading from '@/components/Loading';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import toast from 'react-hot-toast';

const WishlistPage = () => {
    const {
        user,
        favorites,
        fetchFavorites,
        products,
        fetchProductData,
        loadingStates,
        router
    } = useAppContext();

    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareMessage, setShareMessage] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (user) {
            loadWishlistData();
        } else {
            setLoading(false);
        }
    }, [user, favorites, products]);

    const handleShareWishlist = async () => {
        if (wishlistProducts.length === 0) {
            toast.error('Add some products to your wishlist first!');
            return;
        }

        setIsSharing(true);
        try {
            const response = await fetch('/api/wishlist/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productIds: wishlistProducts.map(p => p._id),
                    userName: user?.firstName ? `${user.firstName}` : 'A Sparrow Sports User',
                    message: shareMessage,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShareUrl(data.shareUrl);
                setShowShareModal(true);
                toast.success('Wishlist link created!');
            } else {
                toast.error(data.message || 'Failed to create share link');
            }
        } catch (error) {
            console.error('Error sharing wishlist:', error);
            toast.error('Failed to share wishlist');
        } finally {
            setIsSharing(false);
        }
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const loadWishlistData = async () => {
        setLoading(true);
        try {
            // Ensure we have fresh favorites data
            if (!favorites.length) {
                await fetchFavorites();
            }

            // Ensure we have products data
            if (!products.length) {
                await fetchProductData();
            }

            // Filter products that are in favorites
            const favoriteProducts = products.filter(product =>
                favorites.includes(product._id)
            );

            setWishlistProducts(favoriteProducts);
        } catch (error) {
            console.error('Error loading wishlist data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <SEOMetadata
                    title="Sign In Required | Sparrow Sports"
                    description="Please sign in to view your wishlist and saved products."
                    url="/wishlist"
                />
                <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
                    <div className="text-center max-w-md">
                        <Image
                            src={assets.user_icon}
                            alt="Sign in required"
                            width={80}
                            height={80}
                            className="mx-auto mb-6 opacity-50"
                        />
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Sign In Required
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Please sign in to view your wishlist and save your favorite products.
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/sign-in')}
                                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => router.push('/all-products')}
                                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <SEOMetadata
                title="My Wishlist | Sparrow Sports"
                description="View and manage your saved favorite products at Sparrow Sports. Shop your wishlist items and discover new arrivals."
                keywords="wishlist, favorites, saved products, sports products, sparrow sports"
                url="/wishlist"
            />

            <div className="min-h-screen bg-gray-50">
                <div className="px-6 md:px-16 lg:px-32 py-12">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-orange-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" />
                            </svg>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                My Wishlist
                            </h1>
                        </div>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Keep track of your favorite products and never miss out on the items you love.
                        </p>
                    </div>

                    {/* Wishlist Stats */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center">
                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {wishlistProducts.length}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {wishlistProducts.length === 1 ? 'Item' : 'Items'}
                                    </div>
                                </div>
                                {wishlistProducts.length > 0 && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ₹{Math.min(...wishlistProducts.map(p => p.offerPrice)).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Starting from
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-4">
                                {wishlistProducts.length > 0 && (
                                    <button
                                        onClick={handleShareWishlist}
                                        disabled={isSharing}
                                        className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition flex items-center space-x-2 disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span>{isSharing ? 'Sharing...' : 'Share Wishlist'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push('/all-products')}
                                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Add More Items</span>
                                </button>
                                {wishlistProducts.length > 0 && (
                                    <button
                                        onClick={() => {
                                            // Add all wishlist items to cart
                                            wishlistProducts.forEach(product => {
                                                // You could implement bulk add to cart functionality here
                                                router.push(`/product/${product._id}`);
                                            });
                                        }}
                                        className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5" />
                                        </svg>
                                        <span>View First Item</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <Loading />
                        </div>
                    )}

                    {/* Empty Wishlist State */}
                    {!loading && wishlistProducts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Your wishlist is empty
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Start adding products you love to keep track of them easily.
                                </p>
                                <button
                                    onClick={() => router.push('/all-products')}
                                    className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition"
                                >
                                    Explore Products
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Wishlist Products Grid */}
                    {!loading && wishlistProducts.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {wishlistProducts.map((product) => (
                                <div key={product._id} className="relative">
                                    <ProductCard product={product} />
                                    {/* Wishlist indicator */}
                                    <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Wishlist Tips */}
                    {!loading && wishlistProducts.length > 0 && (
                        <div className="mt-12 bg-orange-50 border border-orange-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Wishlist Tips
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4 text-sm text-orange-800">
                                <div className="flex items-start space-x-2">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Get notified when items go on sale</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Share your wishlist with friends</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Never lose track of items you love</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Share Your Wishlist</h3>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Share this link with friends so they can see your favorite products!
                        </p>

                        {/* Share URL */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Share Link
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                                />
                                <button
                                    onClick={copyShareLink}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        {/* Social Share */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-3">Share via</p>
                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 transition"
                                >
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs">Facebook</span>
                                </button>

                                <button
                                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out my wishlist!`, '_blank')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-sky-50 transition"
                                >
                                    <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs">Twitter</span>
                                </button>

                                <button
                                    onClick={() => window.open(`https://wa.me/?text=Check out my wishlist! ${encodeURIComponent(shareUrl)}`, '_blank')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-green-50 transition"
                                >
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs">WhatsApp</span>
                                </button>

                                <button
                                    onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=Check out my wishlist!`, '_blank')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-sky-50 transition"
                                >
                                    <div className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs">Telegram</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default WishlistPage;