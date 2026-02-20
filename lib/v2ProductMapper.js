const sanitizeNumber = (value) => (Number.isFinite(value) ? value : null);

const buildInventoryMap = ({ variants, inventoryByVariantId }) => {
  const colorInventory = new Map();
  const colorStock = new Map();
  const sizes = new Set();
  const colors = new Set();

  variants.forEach((variant) => {
    const colorName = variant?.color || 'Default';
    const sizeName = variant?.size || 'ONE';
    sizes.add(sizeName);
    colors.add(colorName);

    const inventory = inventoryByVariantId.get(String(variant._id));
    const totalStock = Number.isFinite(inventory?.totalStock) ? inventory.totalStock : 0;
    const reservedStock = Number.isFinite(inventory?.reservedStock) ? inventory.reservedStock : 0;
    const availableStock = Math.max(0, totalStock - reservedStock);

    const existing = colorInventory.get(colorName) || {
      color: {
        name: colorName,
        code: colorName,
        image: ''
      },
      sizeStock: []
    };

    existing.sizeStock.push({
      size: sizeName,
      quantity: availableStock,
      lowStockThreshold: inventory?.lowStockThreshold ?? 5,
      lastRestocked: inventory?.updatedAt || inventory?.createdAt || null
    });

    colorInventory.set(colorName, existing);
    colorStock.set(colorName, (colorStock.get(colorName) || 0) + availableStock);
  });

  return {
    inventory: Array.from(colorInventory.values()),
    color: Array.from(colorStock.entries()).map(([colorName, stock]) => ({
      color: colorName,
      stock
    })),
    sizes: Array.from(sizes),
    availableColors: Array.from(colors),
    totalStock: Array.from(colorStock.values()).reduce((sum, stock) => sum + stock, 0)
  };
};

const mapV2ProductToLegacy = ({ product, variants = [], inventoryByVariantId = new Map() }) => {
  const visibleVariants = variants.filter((variant) => variant?.visibility !== 'hidden');

  const images = [];
  visibleVariants.forEach((variant) => {
    if (Array.isArray(variant?.images)) {
      variant.images.forEach((image) => {
        if (image && !images.includes(image)) {
          images.push(image);
        }
      });
    }
  });

  const offerPrices = visibleVariants
    .map((variant) => sanitizeNumber(variant?.offerPrice))
    .filter((value) => value !== null);
  const originalPrices = visibleVariants
    .map((variant) => sanitizeNumber(variant?.originalPrice))
    .filter((value) => value !== null);

  const offerPrice = offerPrices.length ? Math.min(...offerPrices) : 0;
  const price = originalPrices.length ? Math.max(...originalPrices) : offerPrice;

  const { inventory, color, sizes, availableColors, totalStock } = buildInventoryMap({
    variants: visibleVariants,
    inventoryByVariantId
  });

  return {
    _id: product._id,
    name: product.name,
    description: product.description,
    price,
    offerPrice,
    image: images,
    category: product.category,
    genderCategory: product.genderCategory,
    brand: product.brand,
    inventory,
    color,
    sizes,
    stock: totalStock,
    totalStock,
    availableColors,
    availableSizes: sizes,
    date: product.createdAt?.getTime ? product.createdAt.getTime() : product.createdAt,
    slug: product.slug,
    status: product.status,
    sku: visibleVariants[0]?.sku || product._id
  };
};

export { mapV2ProductToLegacy };
