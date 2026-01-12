'use client'
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

const Home = () => {
  return (
    <>
      <Navbar />
      <SEOMetadata
        title="Sparrow Sports | Premium Sports & Athletic Wear"
        description="Discover premium sports equipment, athletic wear, and accessories at Sparrow Sports. Shop the latest collections from top brands with fast delivery and easy returns."
        keywords="sports equipment, athletic wear, sportswear, sports gear, fitness equipment, athletic apparel, sports accessories, online sports store"
        url="/"
      />
      <div className="px-4 sm:px-6 md:px-16 lg:px-32 pt-20 md:pt-24">
        <HeaderSlider />
        <HomeProducts />
        <RecentlyViewed />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;
