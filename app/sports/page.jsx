
'use client'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// SEO Metadata
const metadata = {
  title: 'Sports | Sparrow Sports',
  description: 'Explore our premium collection of sports apparel and accessories. High-quality t‑shirts, shorts, caps, and more for athletes and enthusiasts.',
  keywords: 'sports, cricket, football, basketball, badminton, tennis, gym wear, sports apparel',
  url: '/sports',
  openGraph: {
    title: 'Sports Collection | Sparrow Sports',
    description: 'Premium sportswear for every game. Discover t‑shirts, shorts, caps, and more.',
  },
};

// Sports Categories with placeholder images
const SPORTS_CATEGORIES = [
  {
    id: 'cricket',
    name: 'Cricket',
    image: '/assets/img/cricket_jersey.png',
    color: 'from-blue-600 to-cyan-500'
  },
  {
    id: 'football',
    name: 'Football',
    image: '/assets/img/running.png',
    color: 'from-green-600 to-emerald-500'
  },
  {
    id: 'basketball',
    name: 'Basketball',
    image: '/assets/img/basketball_jersey.png',
    color: 'from-orange-600 to-red-500'
  },
  {
    id: 'badminton',
    name: 'Badminton',
    image: '/assets/img/upper.png',
    color: 'from-yellow-600 to-orange-500'
  },
  {
    id: 'tennis',
    name: 'Tennis',
    image: '/assets/img/running.png',
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 'gym',
    name: 'Gym & Fitness',
    image: '/assets/img/upper.png',
    color: 'from-purple-600 to-pink-500'
  },
];

// Carousel Images - Ready for your custom images
const CAROUSEL_IMAGES = [
  {
    id: 1,
    image: '/assets/img/running.png',
    title: 'Premium Sports Collection',
    subtitle: 'Elevate Your Performance',
    description: 'Discover our latest athletic wear designed for champions',
    badge: '🔥 NEW ARRIVALS'
  },
  {
    id: 2,
    image: '/assets/img/cricket_jersey.png',
    title: 'Advanced Sports Tech',
    subtitle: 'Performance Meets Innovation',
    description: 'Engineered fabric for maximum comfort and durability',
    badge: '⚡ EXCLUSIVE'
  },
  {
    id: 3,
    image: '/assets/img/basketball_jersey.png',
    title: 'Champion Athlete Gear',
    subtitle: 'Play Like a Pro',
    description: 'Trusted by athletes worldwide for superior quality',
    badge: '🏆 BESTSELLER'
  },
  {
    id: 4,
    image: '/assets/img/upper.png',
    title: 'Ultimate Sports Apparel',
    subtitle: 'Style & Comfort Combined',
    description: 'Premium materials with modern design aesthetics',
    badge: '✨ PREMIUM'
  },
];

// Sample Sports T-shirt Products
const SPORTS_TSHIRTS = [
  {
    id: 1,
    name: 'Cricket Pro Jersey',
    category: 'cricket',
    price: 799,
    image: '/assets/img/cricket_jersey.png',
    rating: 4.5
  },
  {
    id: 2,
    name: 'Football Elite Shirt',
    category: 'football',
    price: 899,
    image: '/assets/img/running.png',
    rating: 4.8
  },
  {
    id: 3,
    name: 'Basketball Performance Tee',
    category: 'basketball',
    price: 849,
    image: '/assets/img/basketball_jersey.png',
    rating: 4.6
  },
  {
    id: 4,
    name: 'Badminton Quick Dry',
    category: 'badminton',
    price: 749,
    image: '/assets/img/upper.png',
    rating: 4.4
  },
  {
    id: 5,
    name: 'Tennis Training Shirt',
    category: 'tennis',
    price: 799,
    image: '/assets/img/running.png',
    rating: 4.7
  },
  {
    id: 6,
    name: 'Gym Flex Tee',
    category: 'gym',
    price: 599,
    image: '/assets/img/upper.png',
    rating: 4.5
  },
];

const SportsPage = () => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = selectedCategory
    ? SPORTS_TSHIRTS.filter(product => product.category === selectedCategory)
    : SPORTS_TSHIRTS;

  return (
    <>
      <SEOMetadata {...metadata} />
      <Navbar />
      
      <main className="min-h-screen bg-white">
        {/* PREMIUM CAROUSEL SECTION */}
        <section className="relative w-full overflow-hidden bg-gray-900">
          {/* Carousel Container */}
          <div className="relative w-full h-80 md:h-[500px] lg:h-[600px]">
            {/* Slides */}
            {CAROUSEL_IMAGES.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === carouselIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Background Image */}
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === carouselIndex}
                    className="object-cover"
                    sizes="100vw"
                  />
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
                </div>

                {/* Content Overlay - Left Side */}
                <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 max-w-2xl">
                  {/* Badge */}
                  <div className="mb-4 inline-block w-fit">
                    <span className="inline-block px-4 py-1.5 bg-orange-500/90 text-white text-xs sm:text-sm font-bold rounded-full backdrop-blur-sm">
                      {slide.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight">
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg sm:text-xl text-orange-400 font-bold mb-4">
                    {slide.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-gray-200 mb-8 max-w-md leading-relaxed">
                    {slide.description}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button className="px-6 sm:px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all duration-300 hover:scale-105 active:scale-95 w-fit">
                      Shop Now
                    </button>
                    <button className="px-6 sm:px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300 w-fit">
                      Explore More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => setCarouselIndex((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-20 backdrop-blur-sm group"
            aria-label="Previous slide"
          >
            <ChevronLeft size={28} className="group-hover:scale-110 transition" />
          </button>
          <button
            onClick={() => setCarouselIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-20 backdrop-blur-sm group"
            aria-label="Next slide"
          >
            <ChevronRight size={28} className="group-hover:scale-110 transition" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {CAROUSEL_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === carouselIndex
                    ? 'bg-orange-500 w-8 h-2.5'
                    : 'bg-white/40 w-2.5 h-2.5 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="absolute top-6 right-6 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm z-20">
            {carouselIndex + 1} / {CAROUSEL_IMAGES.length}
          </div>
        </section>

        {/* SPORTS CATEGORIES SECTION */}
        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Shop by Sport</h2>
            <p className="text-gray-600">Select your sport and explore our premium collection</p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-6 min-w-max md:min-w-0 snap-x snap-mandatory md:snap-none">
              {SPORTS_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  className={`group relative overflow-hidden rounded-lg h-44 w-36 sm:w-40 md:w-auto md:h-56 cursor-pointer transition transform hover:scale-105 flex-shrink-0 md:flex-shrink ${
                    selectedCategory === category.id ? 'ring-4 ring-orange-500' : ''
                  } snap-start`}
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-300"
                    sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 16vw"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-40 group-hover:opacity-50 transition`}></div>
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <h3 className="text-white font-bold text-sm sm:text-base text-center px-2">{category.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedCategory && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-2 bg-gray-200 text-gray-900 rounded-full font-semibold hover:bg-gray-300 transition"
              >
                Clear Filter
              </button>
            </div>
          )}
        </section>

        {/* SPORTS T-SHIRTS LISTING SECTION */}
        <section className="py-16 px-4 md:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {selectedCategory 
                  ? `${SPORTS_CATEGORIES.find(c => c.id === selectedCategory)?.name} Collection`
                  : 'Sports T-Shirts Collection'
                }
              </h2>
              <p className="text-gray-600">Premium quality, designed for performance</p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer"
                  >
                    <div className="relative h-56 md:h-72 overflow-hidden bg-gray-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover hover:scale-110 transition duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {SPORTS_CATEGORIES.find(c => c.id === product.category)?.name}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-orange-600">₹{product.price}</span>
                        <span className="text-sm text-yellow-500">★ {product.rating}</span>
                      </div>
                      <button className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found in this category</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SportsPage;
