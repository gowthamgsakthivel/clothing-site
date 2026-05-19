
'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';
import { useAppContext } from '@/context/AppContext';
import { DEFAULT_CAROUSEL_CONTROLS } from '@/lib/carouselDefaults';

const metadata = {
  title: 'Political | Sparrow Sports',
  description: 'Explore our exclusive political-themed apparel collection. Premium t-shirts and shorts featuring thoughtful designs for expression.',
  keywords: 'political apparel, statement t-shirts, activist clothing, expressive wear',
  url: '/political',
  openGraph: {
    title: 'Political Collection | Sparrow Sports',
    description: 'Thoughtful political-themed apparel for bold everyday style.',
  },
};

const PoliticalPage = () => {
  const { addToCart, router } = useAppContext();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselSlides, setCarouselSlides] = useState(DEFAULT_CAROUSEL_CONTROLS.political);
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
      setCarouselIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  useEffect(() => {
    let isMounted = true;

    const loadCarousel = async () => {
      try {
        const response = await fetch('/api/carousel-controls?page=political');
        const data = await response.json();
        if (isMounted && data?.success && data?.slides?.length) {
          setCarouselSlides(data.slides);
        }
      } catch (error) {
        if (isMounted) setCarouselSlides(DEFAULT_CAROUSEL_CONTROLS.political);
      }
    };

    loadCarousel();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await fetch('/api/product/list?collectionName=political&limit=20');
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
      <main className="min-h-screen bg-white">
        <section className="relative w-full overflow-hidden bg-slate-950">
          <div className="relative w-full h-80 md:h-[500px] lg:h-[600px]">
            {carouselSlides.map((slide, index) => (
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/60 md:to-transparent" />
                </div>

                <div className="absolute inset-0 flex items-end md:items-center">
                  <div className="w-full px-3 pb-3 sm:px-6 sm:pb-6 md:max-w-2xl md:px-12 lg:px-16 md:pb-0">
                    <div className="rounded-2xl border border-white/10 bg-black/22 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
                      <div className="mb-2 flex w-full justify-start">
                        <span className="inline-flex items-center rounded-full bg-red-500/85 px-2.5 py-0.5 text-[9px] sm:text-sm font-bold uppercase tracking-[0.16em] leading-none text-white backdrop-blur-sm">
                          {slide.badge}
                        </span>
                      </div>
                      <h1 className="max-w-lg text-[clamp(1.5rem,7vw,3.5rem)] font-black text-white leading-[0.94] tracking-tight">
                        {slide.title}
                      </h1>
                      <p className="mt-1.5 max-w-md text-xs font-semibold text-red-100 sm:text-xl sm:text-red-300">
                        {slide.subtitle}
                      </p>
                      <p className="hidden sm:block mt-2 max-w-md text-sm leading-relaxed text-white/78 sm:text-base">
                        {slide.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:grid sm:grid-cols-2 sm:gap-4">
                        <button className="flex-1 min-w-[120px] rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition-all duration-300 hover:bg-red-700 active:scale-95 sm:min-w-0 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base">
                          Shop Now
                        </button>
                        <button className="flex-1 min-w-[120px] rounded-lg border border-white/20 bg-white/6 px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-gray-900 sm:min-w-0 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base">
                          Explore More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-20 backdrop-blur-sm group"
            aria-label="Previous slide"
          >
            <ChevronLeft size={28} className="group-hover:scale-110 transition" />
          </button>
          <button
            onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselSlides.length)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-20 backdrop-blur-sm group"
            aria-label="Next slide"
          >
            <ChevronRight size={28} className="group-hover:scale-110 transition" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === carouselIndex
                    ? 'bg-red-500 w-8 h-2.5'
                    : 'bg-white/40 w-2.5 h-2.5 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/50 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold backdrop-blur-sm z-20">
            {carouselIndex + 1} / {carouselSlides.length}
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Political Collection</h2>
            <p className="text-gray-600">Thoughtful statement pieces with a premium finish</p>
          </div>

          {loadingProducts ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              Loading political products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              No political products available yet.
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
                      <p className="text-sm text-gray-600 mb-3">Statement apparel</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-red-600">
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
                          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
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
                  <div key={`political-${item.product?.name || 'product'}`}>
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

export default PoliticalPage;
