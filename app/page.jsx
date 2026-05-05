import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMetadata from "@/components/SEOMetadata";
import RecentlyViewed from "@/components/RecentlyViewed";
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

async function fetchCarouselControls(page) {
  try {
    const headerList = await headers();
    const host = headerList.get('host');
    const protocol = headerList.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/carousel-controls?page=${page}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.slides || [];
  } catch (e) {
    console.error('fetchCarouselControls error', e);
    return [];
  }
}

async function fetchFeaturedProducts() {
  try {
    const headerList = await headers();
    const host = headerList.get('host');
    const protocol = headerList.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/featured-products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.featuredProducts || [];
  } catch (e) {
    console.error('fetchFeaturedProducts error', e);
    return [];
  }
}

const Home = async () => {
  const homeSlides = await fetchCarouselControls('home');
  const featuredProducts = await fetchFeaturedProducts();

  return (
    <>
      <Navbar />
      <SEOMetadata
        title="Sparrow Sports | Premium Sports & Athletic Wear"
        description="Discover premium sports equipment, athletic wear, and accessories at Sparrow Sports. Shop the latest collections from top brands with fast delivery and easy returns."
        keywords="sports equipment, athletic wear, sportswear, sports gear, fitness equipment, athletic apparel, sports accessories, online sports store"
        url="/"
      />
      <div className="px-4 sm:px-6 md:px-16 lg:px-32 pt-16 md:pt-16">
        <HeaderSlider slides={homeSlides} />
        <HomeProducts />
        <RecentlyViewed />
        <FeaturedProduct products={featuredProducts} />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;
