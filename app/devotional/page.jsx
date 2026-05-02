
'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';
import { useAppContext } from '@/context/AppContext';

const metadata = {
  title: 'Devotional | Sparrow Sports',
  description: 'Discover a curated range of devotional apparel. Comfortable and stylish t-shirts, tops, and accessories for spiritual expression.',
  keywords: 'devotional wear, faith apparel, spiritual t-shirts, devotional clothing',
  url: '/devotional',
  openGraph: {
    title: 'Devotional Collection | Sparrow Sports',
    description: 'Premium devotional wear with thoughtful designs for mindful style.',
  },
};

const DEVOTIONAL_CAROUSEL = [
  {
    id: 1,
    image: '/assets/img/upper.png',
    title: 'Devotional Collection',
    subtitle: 'Wear Your Faith',
    description: 'Thoughtfully designed apparel that blends comfort, meaning, and everyday style.',
    badge: '✨ NEW ARRIVALS',
  },
  {
    id: 2,
    image: '/assets/img/cricket_jersey.png',
    title: 'Comfort Meets Purpose',
    subtitle: 'Made for Daily Wear',
    description: 'Premium fabrics and calm tones designed for all-day comfort and expression.',
    badge: '🙏 BESTSELLER',
  },
  {
    id: 3,
    image: '/assets/img/running.png',
    title: 'Faith Inspired Styles',
    subtitle: 'Simple. Elegant. Meaningful.',
    description: 'Curated pieces that keep the message clear while staying modern and wearable.',
    badge: '🌿 EXCLUSIVE',
  },
  {
    id: 4,
    image: '/assets/img/basketball_jersey.png',
    title: 'Soft Everyday Essentials',
    subtitle: 'Built Around Comfort',
    description: 'A refined devotional range with versatile designs you can wear anywhere.',
    badge: '💫 PREMIUM',
  },
];

const DevotionalPage = () => {
  const { addToCart, router } = useAppContext();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const getDisplayPrice = (variants) => {
    const prices = (variants || [])
      .map((variant) => variant.offerPrice ?? variant.originalPrice)
      .filter((price) => typeof price === 'number');
    if (!prices.length) return null;
    return Math.min(...prices);
  };

  const getPrimaryVariant = (item) => item?.variants?.[0] || item?.product?.variants?.[0] || null;

  const handleAddToCart = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    const productId = item?.product?._id || item?._id;
    if (!productId) {
      toast.error('Product unavailable');
      return;
    }
    const variant = getPrimaryVariant(item);
    if (variant?.color && variant?.size) {
      addToCart(productId, { color: variant.color, size: variant.size, quantity: 1 });
      return;
    }
    addToCart(productId);
  };

  const handleBuyNow = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    const productId = item?.product?._id || item?._id;
    if (!productId) {
      toast.error('Product unavailable');
      return;
    }
    router.push(`/product/${productId}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % DEVOTIONAL_CAROUSEL.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await fetch('/api/product/list?collectionName=devotional&limit=20');
        const data = await response.json();
        if (isMounted && data?.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <SEOMetadata {...metadata} />
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="relative w-full overflow-hidden bg-slate-900">
          <div className="relative w-full h-80 md:h-[500px] lg:h-[600px]">
            {DEVOTIONAL_CAROUSEL.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === carouselIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === carouselIndex}
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 max-w-2xl">
                  <div className="mb-4 inline-block w-fit">
                    <span className="inline-block px-4 py-1.5 bg-emerald-500/90 text-white text-xs sm:text-sm font-bold rounded-full backdrop-blur-sm">
                      {slide.badge}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-lg sm:text-xl text-emerald-300 font-bold mb-4">
                    {slide.subtitle}
                  </p>
                  <p className="text-sm sm:text-base text-slate-200 mb-8 max-w-md leading-relaxed">
                    {slide.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button className="px-6 sm:px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all duration-300 hover:scale-105 active:scale-95 w-fit">
                      Shop Now
                    </button>
                    <button className="px-6 sm:px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-300 w-fit">
                      Explore More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCarouselIndex((prev) => (prev - 1 + DEVOTIONAL_CAROUSEL.length) % DEVOTIONAL_CAROUSEL.length)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-20 backdrop-blur-sm group"
            aria-label="Previous slide"
          >
            <ChevronLeft size={28} className="group-hover:scale-110 transition" />
          </button>
          <button
            onClick={() => setCarouselIndex((prev) => (prev + 1) % DEVOTIONAL_CAROUSEL.length)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-20 backdrop-blur-sm group"
            aria-label="Next slide"
          >
            <ChevronRight size={28} className="group-hover:scale-110 transition" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {DEVOTIONAL_CAROUSEL.map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === carouselIndex
                    ? 'bg-emerald-400 w-8 h-2.5'
                    : 'bg-white/40 w-2.5 h-2.5 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-6 right-6 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm z-20">
            {carouselIndex + 1} / {DEVOTIONAL_CAROUSEL.length}
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Devotional Collection</h2>
            <p className="text-gray-600">Comfortable, meaningful, and designed for everyday wear</p>
          </div>

          {loadingProducts ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              Loading devotional products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              No devotional products available yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((item) => {
                const price = getDisplayPrice(item.variants);
                const image = item.variants?.[0]?.images?.[0];
                const productId = item.product?._id;

                const content = (
                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer">
                    <div className="relative h-56 md:h-72 overflow-hidden bg-gray-100">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.product?.name}
                          fill
                          className="object-cover hover:scale-110 transition duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.product?.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">Faith-inspired apparel</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-emerald-600">
                          {price ? `₹${price}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => handleBuyNow(event, item)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                          disabled={!productId}
                        >
                          Buy Now
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleAddToCart(event, item)}
                          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          disabled={!productId}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );

                return productId ? (
                  <Link key={productId} href={`/product/${productId}`} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={`devotional-${item.product?.name || 'product'}`}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default DevotionalPage;
