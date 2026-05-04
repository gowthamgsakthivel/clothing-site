import mongoose from 'mongoose';
import Review from '@/models/Review';
import OrderV2 from '@/models/v2/Order';
import ProductVariant from '@/models/v2/ProductVariant';
import ProductV2 from '@/models/v2/Product';

export const getDeliveredPurchaseOrder = async ({ userId, productId, orderId = null }) => {
    const variants = await ProductVariant.find({ productId }, '_id').lean();
    const variantIds = variants.map((variant) => variant._id).filter(Boolean);

    if (!variantIds.length) {
        return null;
    }

    const query = {
        userId,
        status: { $in: ['delivered', 'Delivered'] },
        'items.variantId': { $in: variantIds }
    };

    if (orderId) {
        query._id = orderId;
    }

    return OrderV2.findOne(query).lean();
};

export const ensureDeliveredPurchase = async ({ userId, productId, orderId = null }) => {
    const purchaseOrder = await getDeliveredPurchaseOrder({ userId, productId, orderId });
    const hasPurchased = Boolean(purchaseOrder);

    if (!hasPurchased) {
        throw new Error('Only buyers can review');
    }

    return purchaseOrder;
};

export const refreshProductRatingStats = async (productId) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return { avgRating: 0, ratingCount: 0 };
    }

    const [stats] = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: '$productId',
                avgRating: { $avg: '$rating' },
                ratingCount: { $sum: 1 }
            }
        }
    ]);

    const avgRating = stats?.avgRating ? Number(stats.avgRating.toFixed(1)) : 0;
    const ratingCount = stats?.ratingCount || 0;

    await ProductV2.findByIdAndUpdate(productId, {
        $set: {
            avgRating,
            ratingCount
        }
    });

    return { avgRating, ratingCount };
};
