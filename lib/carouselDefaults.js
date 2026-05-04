import { assets } from '@/assets/assets';

export const CAROUSEL_PAGES = ['home', 'sports', 'devotional', 'political'];

export const DEFAULT_CAROUSEL_CONTROLS = {
  home: [
    {
      id: 1,
      title: 'Elevate Your Game - Puma T-Shirt Built for Comfort & Performance',
      offer: 'Limited Time Offer 30% Off',
      buttonText1: 'Buy now',
      buttonText2: 'Find more',
      imgSrc: assets.header_puma_tshirt,
      order: 0,
      active: true
    },
    {
      id: 2,
      title: 'Power Your Moves - Nike Shorts for Every Game!',
      offer: 'Hurry up only few lefts!',
      buttonText1: 'Shop Now',
      buttonText2: 'Explore Deals',
      imgSrc: assets.header_nike_shorts,
      order: 1,
      active: true
    },
    {
      id: 3,
      title: 'Power Meets Elegance - Apple MacBook Pro is Here for you!',
      offer: 'Exclusive Deal 40% Off',
      buttonText1: 'Order Now',
      buttonText2: 'Learn More',
      imgSrc: assets.header_adidas_jacket,
      order: 2,
      active: true
    }
  ],
  sports: [
    {
      id: 1,
      image: '/assets/img/running.png',
      title: 'Premium Sports Collection',
      subtitle: 'Elevate Your Performance',
      description: 'Discover our latest athletic wear designed for champions',
      badge: '🔥 NEW ARRIVALS',
      order: 0,
      active: true
    },
    {
      id: 2,
      image: '/assets/img/cricket_jersey.png',
      title: 'Advanced Sports Tech',
      subtitle: 'Performance Meets Innovation',
      description: 'Engineered fabric for maximum comfort and durability',
      badge: '⚡ EXCLUSIVE',
      order: 1,
      active: true
    },
    {
      id: 3,
      image: '/assets/img/basketball_jersey.png',
      title: 'Champion Athlete Gear',
      subtitle: 'Play Like a Pro',
      description: 'Trusted by athletes worldwide for superior quality',
      badge: '🏆 BESTSELLER',
      order: 2,
      active: true
    },
    {
      id: 4,
      image: '/assets/img/upper.png',
      title: 'Ultimate Sports Apparel',
      subtitle: 'Style & Comfort Combined',
      description: 'Premium materials with modern design aesthetics',
      badge: '✨ PREMIUM',
      order: 3,
      active: true
    }
  ],
  devotional: [
    {
      id: 1,
      image: '/assets/img/upper.png',
      title: 'Devotional Collection',
      subtitle: 'Wear Your Faith',
      description: 'Thoughtfully designed apparel that blends comfort, meaning, and everyday style.',
      badge: '✨ NEW ARRIVALS',
      order: 0,
      active: true
    },
    {
      id: 2,
      image: '/assets/img/cricket_jersey.png',
      title: 'Comfort Meets Purpose',
      subtitle: 'Made for Daily Wear',
      description: 'Premium fabrics and calm tones designed for all-day comfort and expression.',
      badge: '🙏 BESTSELLER',
      order: 1,
      active: true
    },
    {
      id: 3,
      image: '/assets/img/running.png',
      title: 'Faith Inspired Styles',
      subtitle: 'Simple. Elegant. Meaningful.',
      description: 'Curated pieces that keep the message clear while staying modern and wearable.',
      badge: '🌿 EXCLUSIVE',
      order: 2,
      active: true
    },
    {
      id: 4,
      image: '/assets/img/basketball_jersey.png',
      title: 'Soft Everyday Essentials',
      subtitle: 'Built Around Comfort',
      description: 'A refined devotional range with versatile designs you can wear anywhere.',
      badge: '💫 PREMIUM',
      order: 3,
      active: true
    }
  ],
  political: [
    {
      id: 1,
      image: '/assets/img/running.png',
      title: 'Political Apparel',
      subtitle: 'Say It With Style',
      description: 'Bold yet wearable designs for people who want their clothing to say something meaningful.',
      badge: '🗳️ NEW ARRIVALS',
      order: 0,
      active: true
    },
    {
      id: 2,
      image: '/assets/img/cricket_jersey.png',
      title: 'Statement Pieces',
      subtitle: 'Comfortable Everyday Wear',
      description: 'Premium fits and clean graphics designed to work in casual settings and events alike.',
      badge: '📣 EXCLUSIVE',
      order: 1,
      active: true
    },
    {
      id: 3,
      image: '/assets/img/basketball_jersey.png',
      title: 'Expressive Streetwear',
      subtitle: 'Modern. Sharp. Clear.',
      description: 'A refined collection that combines strong visual language with everyday comfort.',
      badge: '🔥 BESTSELLER',
      order: 2,
      active: true
    },
    {
      id: 4,
      image: '/assets/img/upper.png',
      title: 'Conversation Starters',
      subtitle: 'Built To Stand Out',
      description: 'Statement apparel designed to feel premium while remaining easy to wear anywhere.',
      badge: '⭐ PREMIUM',
      order: 3,
      active: true
    }
  ]
};

export const getDefaultCarouselControls = () =>
  JSON.parse(JSON.stringify(DEFAULT_CAROUSEL_CONTROLS));
