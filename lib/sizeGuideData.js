// Size chart data for different product categories

export const sizeCharts = {
  // Men's Tops (T-shirts, Jerseys, Jackets)
  menTops: {
    title: "Men's Tops Size Guide",
    measurements: ['Chest', 'Waist', 'Length'],
    unit: 'inches',
    sizes: [
      { size: 'XS', us: 'XS', uk: 'XS', eu: '44', chest: '32-34', waist: '26-28', length: '27' },
      { size: 'S', us: 'S', uk: 'S', eu: '46-48', chest: '34-36', waist: '28-30', length: '28' },
      { size: 'M', us: 'M', uk: 'M', eu: '48-50', chest: '38-40', waist: '32-34', length: '29' },
      { size: 'L', us: 'L', uk: 'L', eu: '52-54', chest: '42-44', waist: '36-38', length: '30' },
      { size: 'XL', us: 'XL', uk: 'XL', eu: '56-58', chest: '46-48', waist: '40-42', length: '31' },
      { size: '2XL', us: '2XL', uk: '2XL', eu: '60-62', chest: '50-52', waist: '44-46', length: '32' },
    ]
  },

  // Women's Tops
  womenTops: {
    title: "Women's Tops Size Guide",
    measurements: ['Bust', 'Waist', 'Hip', 'Length'],
    unit: 'inches',
    sizes: [
      { size: 'XS', us: '0-2', uk: '4-6', eu: '32-34', bust: '31-32', waist: '24-25', hip: '33-34', length: '25' },
      { size: 'S', us: '4-6', uk: '8-10', eu: '36-38', bust: '33-34', waist: '26-27', hip: '35-36', length: '26' },
      { size: 'M', us: '8-10', uk: '12-14', eu: '40-42', bust: '35-36', waist: '28-29', hip: '37-38', length: '27' },
      { size: 'L', us: '12-14', uk: '16-18', eu: '44-46', bust: '37-39', waist: '30-32', hip: '39-41', length: '28' },
      { size: 'XL', us: '16-18', uk: '20-22', eu: '48-50', bust: '40-42', waist: '33-35', hip: '42-44', length: '29' },
      { size: '2XL', us: '20-22', uk: '24-26', eu: '52-54', bust: '43-45', waist: '36-38', hip: '45-47', length: '30' },
    ]
  },

  // Men's Bottoms (Shorts, Pants, Track Pants)
  menBottoms: {
    title: "Men's Bottoms Size Guide",
    measurements: ['Waist', 'Hip', 'Inseam'],
    unit: 'inches',
    sizes: [
      { size: 'XS', us: '26-28', uk: '26-28', eu: '42-44', waist: '26-28', hip: '32-34', inseam: '30' },
      { size: 'S', us: '28-30', uk: '28-30', eu: '44-46', waist: '28-30', hip: '34-36', inseam: '31' },
      { size: 'M', us: '32-34', uk: '32-34', eu: '48-50', waist: '32-34', hip: '38-40', inseam: '32' },
      { size: 'L', us: '36-38', uk: '36-38', eu: '52-54', waist: '36-38', hip: '42-44', inseam: '33' },
      { size: 'XL', us: '40-42', uk: '40-42', eu: '56-58', waist: '40-42', hip: '46-48', inseam: '34' },
      { size: '2XL', us: '44-46', uk: '44-46', eu: '60-62', waist: '44-46', hip: '50-52', inseam: '34' },
    ]
  },

  // Women's Bottoms
  womenBottoms: {
    title: "Women's Bottoms Size Guide",
    measurements: ['Waist', 'Hip', 'Inseam'],
    unit: 'inches',
    sizes: [
      { size: 'XS', us: '0-2', uk: '4-6', eu: '32-34', waist: '24-25', hip: '33-34', inseam: '29' },
      { size: 'S', us: '4-6', uk: '8-10', eu: '36-38', waist: '26-27', hip: '35-36', inseam: '29' },
      { size: 'M', us: '8-10', uk: '12-14', eu: '40-42', waist: '28-29', hip: '37-38', inseam: '30' },
      { size: 'L', us: '12-14', uk: '16-18', eu: '44-46', waist: '30-32', hip: '39-41', inseam: '30' },
      { size: 'XL', us: '16-18', uk: '20-22', eu: '48-50', waist: '33-35', hip: '42-44', inseam: '31' },
      { size: '2XL', us: '20-22', uk: '24-26', eu: '52-54', waist: '36-38', hip: '45-47', inseam: '31' },
    ]
  },

  // Shoes - Men's
  menShoes: {
    title: "Men's Shoes Size Guide",
    measurements: ['Foot Length'],
    unit: 'cm',
    sizes: [
      { size: 'US 6', us: '6', uk: '5.5', eu: '39', footLength: '24.1' },
      { size: 'US 7', us: '7', uk: '6', eu: '40', footLength: '25.0' },
      { size: 'US 8', us: '8', uk: '7', eu: '41', footLength: '25.9' },
      { size: 'US 9', us: '9', uk: '8', eu: '42', footLength: '26.7' },
      { size: 'US 10', us: '10', uk: '9', eu: '43', footLength: '27.6' },
      { size: 'US 11', us: '11', uk: '10', eu: '44', footLength: '28.4' },
      { size: 'US 12', us: '12', uk: '11', eu: '45', footLength: '29.3' },
      { size: 'US 13', us: '13', uk: '12', eu: '46', footLength: '30.1' },
    ]
  },

  // Shoes - Women's
  womenShoes: {
    title: "Women's Shoes Size Guide",
    measurements: ['Foot Length'],
    unit: 'cm',
    sizes: [
      { size: 'US 5', us: '5', uk: '3', eu: '35', footLength: '22.0' },
      { size: 'US 6', us: '6', uk: '4', eu: '36', footLength: '22.9' },
      { size: 'US 7', us: '7', uk: '5', eu: '37', footLength: '23.8' },
      { size: 'US 8', us: '8', uk: '6', eu: '38', footLength: '24.6' },
      { size: 'US 9', us: '9', uk: '7', eu: '39', footLength: '25.5' },
      { size: 'US 10', us: '10', uk: '8', eu: '40', footLength: '26.3' },
      { size: 'US 11', us: '11', uk: '9', eu: '41', footLength: '27.2' },
    ]
  },
};

// Utility function to get size chart based on product category and subcategory
export const getSizeChart = (category, subcategory) => {
  const categoryLower = category?.toLowerCase() || '';
  const subcategoryLower = subcategory?.toLowerCase() || '';

  // Determine gender
  const isMen = categoryLower.includes('men') || categoryLower === 'men';
  const isWomen = categoryLower.includes('women') || categoryLower === 'women';

  // Determine product type
  const isShoes = subcategoryLower.includes('shoe') || subcategoryLower.includes('sneaker') || subcategoryLower.includes('trainer');
  const isBottoms = subcategoryLower.includes('short') || subcategoryLower.includes('pant') || subcategoryLower.includes('trouser') || subcategoryLower.includes('jogger') || subcategoryLower.includes('track');
  const isTops = subcategoryLower.includes('shirt') || subcategoryLower.includes('jersey') || subcategoryLower.includes('jacket') || subcategoryLower.includes('hoodie') || subcategoryLower.includes('top');

  // Return appropriate chart
  if (isShoes) {
    return isMen ? sizeCharts.menShoes : sizeCharts.womenShoes;
  } else if (isBottoms) {
    return isMen ? sizeCharts.menBottoms : sizeCharts.womenBottoms;
  } else if (isTops || isMen || isWomen) {
    return isMen ? sizeCharts.menTops : sizeCharts.womenTops;
  }

  // Default to men's tops if category unclear
  return sizeCharts.menTops;
};

// Measurement tips
export const measurementTips = {
  chest: "Measure around the fullest part of your chest, keeping the tape parallel to the floor.",
  bust: "Measure around the fullest part of your bust, keeping the tape parallel to the floor.",
  waist: "Measure around your natural waistline, keeping the tape comfortably loose.",
  hip: "Measure around the fullest part of your hips, keeping the tape parallel to the floor.",
  inseam: "Measure from the top of your inner leg to the bottom of your ankle.",
  length: "Measure from the highest point of the shoulder down to the hem.",
  footLength: "Stand on a piece of paper and mark the heel and longest toe. Measure the distance between marks.",
};

// Fit recommendations
export const fitGuides = {
  slim: {
    title: "Slim Fit",
    description: "Fitted through the chest and waist with tapered sleeves. Best for athletic builds.",
    recommendation: "If you prefer a closer fit, choose your regular size. For more room, size up."
  },
  regular: {
    title: "Regular Fit",
    description: "Classic fit with room through the chest and waist. Most versatile fit for all body types.",
    recommendation: "Choose your regular size for a comfortable, relaxed fit."
  },
  relaxed: {
    title: "Relaxed Fit",
    description: "Generous cut with extra room throughout. Great for layering and casual wear.",
    recommendation: "Choose your regular size for a loose fit, or size down for a more fitted look."
  },
  athletic: {
    title: "Athletic Fit",
    description: "Designed for muscular builds with extra room in shoulders and chest, tapered waist.",
    recommendation: "If you have an athletic build, choose your regular size. Others may prefer to size down."
  }
};

// Size conversion helper
export const convertSize = (size, fromSystem, toSystem) => {
  // This is a simplified conversion - real implementation would need comprehensive mapping
  const conversions = {
    'S': { us: 'S', uk: 'S', eu: '46-48' },
    'M': { us: 'M', uk: 'M', eu: '48-50' },
    'L': { us: 'L', uk: 'L', eu: '52-54' },
    'XL': { us: 'XL', uk: 'XL', eu: '56-58' },
  };

  return conversions[size]?.[toSystem] || size;
};
