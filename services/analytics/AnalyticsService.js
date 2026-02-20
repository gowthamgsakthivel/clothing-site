import connectDB from '@/config/db';
import OrderV2 from '@/models/v2/Order';
import Shipment from '@/models/v2/Shipment';
import Inventory from '@/models/v2/Inventory';
import ProductVariant from '@/models/v2/ProductVariant';
import ProductV2 from '@/models/v2/Product';

const DAY_MS = 24 * 60 * 60 * 1000;

const getAnalyticsSummary = async () => {
  await connectDB();

  const now = new Date();
  const startDate = new Date(now.getTime() - (29 * DAY_MS));

  const [
    totalRevenueAgg,
    totalOrders,
    deliveredOrders,
    rtoCount,
    pendingShipments,
    inventorySummary
  ] = await Promise.all([
    OrderV2.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]),
    OrderV2.countDocuments(),
    OrderV2.countDocuments({ status: 'delivered' }),
    Shipment.countDocuments({ externalStatus: 'rto' }),
    Shipment.countDocuments({ externalStatus: { $in: ['unknown', 'failed', 'out_for_delivery'] } }),
    Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalAvailableStock: { $sum: { $subtract: ['$totalStock', '$reservedStock'] } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: [{ $subtract: ['$totalStock', '$reservedStock'] }, '$lowStockThreshold'] },
                1,
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  const totalRevenue = totalRevenueAgg?.[0]?.total || 0;
  const totalAvailableStock = inventorySummary?.[0]?.totalAvailableStock || 0;
  const lowStockCount = inventorySummary?.[0]?.lowStockCount || 0;

  const revenueTrendAgg = await OrderV2.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$grandTotal' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const orderTrendAgg = await OrderV2.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const trendMap = (agg) => agg.reduce((acc, entry) => {
    acc[entry._id] = entry.total;
    return acc;
  }, {});

  const revenueMap = trendMap(revenueTrendAgg);
  const orderMap = trendMap(orderTrendAgg);

  const revenueTrend = [];
  const orderTrend = [];

  for (let i = 0; i < 30; i += 1) {
    const date = new Date(startDate.getTime() + (i * DAY_MS));
    const key = date.toISOString().slice(0, 10);
    revenueTrend.push({ date: key, value: revenueMap[key] || 0 });
    orderTrend.push({ date: key, value: orderMap[key] || 0 });
  }

  const topVariants = await OrderV2.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.variantId',
        revenue: { $sum: '$items.totalPrice' },
        quantity: { $sum: '$items.quantity' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  const variantIds = topVariants.map((entry) => entry._id).filter(Boolean);
  const variants = variantIds.length
    ? await ProductVariant.find({ _id: { $in: variantIds } }).lean()
    : [];

  const variantMap = variants.reduce((acc, variant) => {
    acc[variant._id.toString()] = variant;
    return acc;
  }, {});

  const productIds = variants.map((variant) => variant.productId).filter(Boolean);
  const products = productIds.length
    ? await ProductV2.find({ _id: { $in: productIds } }, 'name').lean()
    : [];

  const productMap = products.reduce((acc, product) => {
    acc[product._id.toString()] = product;
    return acc;
  }, {});

  const topProducts = topVariants.map((entry) => {
    const variant = variantMap[entry._id?.toString()] || {};
    const product = productMap[variant.productId?.toString()] || {};
    return {
      variantId: entry._id,
      productName: product.name || 'Unknown',
      sku: variant.sku || '--',
      revenue: entry.revenue || 0,
      quantity: entry.quantity || 0
    };
  });

  const lowStockSkus = await Inventory.find({
    $expr: {
      $lte: [
        { $subtract: ['$totalStock', '$reservedStock'] },
        '$lowStockThreshold'
      ]
    }
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  return {
    totalRevenue,
    totalOrders,
    deliveredOrders,
    rtoCount,
    pendingShipments,
    totalAvailableStock,
    lowStockCount,
    revenueTrend,
    orderTrend,
    topProducts,
    lowStockSkus
  };
};

export { getAnalyticsSummary };
