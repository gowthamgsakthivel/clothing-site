const sanitizeNumber = (value) => (Number.isFinite(value) ? value : null);

const buildInventoryByVariantId = (inventories = []) => {
  const inventoryByVariantId = {};
  inventories.forEach((inventory) => {
    if (inventory?.variantId) {
      inventoryByVariantId[String(inventory.variantId)] = inventory;
    }
  });
  return inventoryByVariantId;
};

const getVisibleVariants = (variants = []) =>
  variants.filter((variant) => variant?.visibility !== 'hidden');

const getVariantStock = (variant, inventoryByVariantId = {}) => {
  const inventory = inventoryByVariantId[String(variant?._id)] || {};
  const totalStock = Number.isFinite(inventory.totalStock) ? inventory.totalStock : 0;
  const reservedStock = Number.isFinite(inventory.reservedStock) ? inventory.reservedStock : 0;
  const availableStock = Math.max(0, totalStock - reservedStock);

  return {
    totalStock,
    reservedStock,
    availableStock,
    lowStockThreshold: inventory.lowStockThreshold ?? 5,
    lastRestocked: inventory.updatedAt || inventory.createdAt || null
  };
};

const getProductImages = (variants = []) => {
  const images = [];
  variants.forEach((variant) => {
    if (Array.isArray(variant?.images)) {
      variant.images.forEach((image) => {
        if (image && !images.includes(image)) {
          images.push(image);
        }
      });
    }
  });
  return images;
};

const getPriceSummary = (variants = []) => {
  const offerPrices = variants
    .map((variant) => sanitizeNumber(variant?.offerPrice))
    .filter((value) => value !== null);
  const originalPrices = variants
    .map((variant) => sanitizeNumber(variant?.originalPrice))
    .filter((value) => value !== null);

  const offerPrice = offerPrices.length ? Math.min(...offerPrices) : 0;
  const price = originalPrices.length ? Math.max(...originalPrices) : offerPrice;

  return { offerPrice, price };
};

const buildColorSizeMatrix = (variants = [], inventoryByVariantId = {}) => {
  const colorInventory = new Map();

  variants.forEach((variant) => {
    const colorName = variant?.color || 'Default';
    const sizeName = variant?.size || 'ONE';
    const stock = getVariantStock(variant, inventoryByVariantId);

    const existing = colorInventory.get(colorName) || {
      color: {
        name: colorName,
        code: colorName,
        image: ''
      },
      sizeStock: [],
      stock: 0
    };

    existing.sizeStock.push({
      size: sizeName,
      quantity: stock.availableStock,
      lowStockThreshold: stock.lowStockThreshold,
      lastRestocked: stock.lastRestocked
    });

    existing.stock += stock.availableStock;
    colorInventory.set(colorName, existing);
  });

  return Array.from(colorInventory.values());
};

const getAvailableSizes = (variants = []) => {
  const sizes = new Set();
  variants.forEach((variant) => {
    if (variant?.size) {
      sizes.add(variant.size);
    }
  });
  return Array.from(sizes);
};

const getProductSummary = (bundle) => {
  const product = bundle?.product || {};
  const variants = getVisibleVariants(bundle?.variants || []);
  const inventoryByVariantId = bundle?.inventoryByVariantId || {};
  const images = getProductImages(variants);
  const { offerPrice, price } = getPriceSummary(variants);
  const inventory = buildColorSizeMatrix(variants, inventoryByVariantId);
  const totalStock = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  const availableSizes = Array.from(
    new Set(
      inventory.flatMap((item) =>
        item.sizeStock.filter((sizeStock) => sizeStock.quantity > 0).map((sizeStock) => sizeStock.size)
      )
    )
  );

  return {
    _id: product._id,
    name: product.name,
    description: product.description,
    brand: product.brand,
    category: product.category,
    genderCategory: product.genderCategory,
    date: product.createdAt?.getTime ? product.createdAt.getTime() : product.createdAt,
    slug: product.slug,
    status: product.status,
    images,
    offerPrice,
    price,
    avgRating: Number.isFinite(product.avgRating) ? product.avgRating : 0,
    ratingCount: Number.isFinite(product.ratingCount) ? product.ratingCount : 0,
    stock: totalStock,
    totalStock,
    inventory,
    availableColors: inventory.map((item) => item.color?.name).filter(Boolean),
    availableSizes,
    sizes: getAvailableSizes(variants)
  };
};

const findVariantForSelection = (variants = [], color, size) => {
  if (!variants.length) return null;
  const colorKey = color || null;
  const sizeKey = size || null;

  let match = variants.find((variant) => {
    const matchesColor = colorKey ? variant?.color === colorKey : true;
    const matchesSize = sizeKey ? variant?.size === sizeKey : true;
    return matchesColor && matchesSize;
  });

  if (!match && colorKey && !sizeKey) {
    match = variants.find((variant) => variant?.color === colorKey);
  }

  if (!match && sizeKey && !colorKey) {
    match = variants.find((variant) => variant?.size === sizeKey);
  }

  return match || variants[0] || null;
};

export {
  buildInventoryByVariantId,
  getVisibleVariants,
  getVariantStock,
  getProductImages,
  getPriceSummary,
  buildColorSizeMatrix,
  getAvailableSizes,
  getProductSummary,
  findVariantForSelection
};
