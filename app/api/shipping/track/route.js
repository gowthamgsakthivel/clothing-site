import connectDB from "@/config/db";
import OrderV2 from "@/models/v2/Order";
import Shipment from "@/models/v2/Shipment";
import { trackShiprocketShipment } from "@/lib/shiprocket";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authRoles";

const mapExternalToOrderStatus = (externalStatus) => {
  const normalized = (externalStatus || '').toLowerCase();

  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'out_for_delivery') return 'out_for_delivery';
  if (normalized === 'shipped' || normalized === 'in_transit') return 'shipped';
  if (normalized === 'rto') return 'rto';
  if (normalized === 'failed') return 'failed';

  return null;
};

const syncOrderStatusFromExternal = async (order, externalStatus) => {
  if (!order) return;

  const nextStatus = mapExternalToOrderStatus(externalStatus);
  if (!nextStatus) return;

  const current = (order.status || '').toLowerCase();
  if (current === 'cancelled') return;

  const rank = {
    placed: 0,
    pending: 0,
    packed: 1,
    shipped: 2,
    out_for_delivery: 3,
    delivered: 4,
    rto: 4,
    failed: 4
  };

  const currentRank = rank[current] ?? -1;
  const nextRank = rank[nextStatus] ?? -1;

  if (current === 'delivered' && ['shipped', 'out_for_delivery', 'rto', 'failed'].includes(nextStatus)) {
    return;
  }

  if (nextRank >= currentRank && current !== nextStatus) {
    await OrderV2.findByIdAndUpdate(order._id, { $set: { status: nextStatus } });
  }
};

export async function GET(request) {
  try {
    const { userId, role } = await requireUser({ allowAdmin: true });
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'orderId is required'
      }, { status: 400 });
    }

    await connectDB();
    const order = await OrderV2.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    const isOwner = order.userId?.toString() === userId;
    const isAdmin = role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    const shipment = await Shipment.findOne({ orderId }).lean();
    if (!shipment) {
      return NextResponse.json({
        success: false,
        message: 'Shipment not found'
      }, { status: 404 });
    }

    const awbCode = shipment.awb || shipment.awbCode || null;
    if (!awbCode) {
      return NextResponse.json({
        success: false,
        message: 'Shipment not ready for tracking'
      }, { status: 400 });
    }

    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: 'Shiprocket tracking is not configured'
      }, { status: 503 });
    }

    const trackingData = await trackShiprocketShipment({
      awbCode
    });

    const rawStatus = trackingData?.tracking_data?.shipment_status
      || trackingData?.tracking_data?.shipment_track?.[0]?.current_status
      || shipment.externalStatus
      || shipment.status;

    const statusMap = {
      manifested: 'shipped',
      'in transit': 'in_transit',
      'out for delivery': 'out_for_delivery',
      delivered: 'delivered',
      rto: 'rto',
      'pickup scheduled': 'processing',
      'picked up': 'shipped'
    };

    const normalizedStatus = statusMap[(rawStatus || '').toLowerCase()] || (rawStatus || '').toLowerCase();
    await Shipment.findOneAndUpdate(
      { orderId },
      {
        $set: {
          externalStatus: normalizedStatus || shipment.externalStatus || shipment.status || null,
          status: normalizedStatus === 'delivered'
            ? 'delivered'
            : ['shipped', 'out_for_delivery', 'in_transit'].includes(normalizedStatus)
              ? 'shipped'
              : shipment.status,
          trackingUrl: trackingData?.tracking_data?.track_url || shipment.trackingUrl || null
        }
      }
    );

    await syncOrderStatusFromExternal(order, normalizedStatus);

    return NextResponse.json({
      success: true,
      tracking: trackingData
    });
  } catch (error) {
    const status = error.status || 500;
    console.error('Shiprocket tracking error:', error.message);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error fetching tracking'
    }, { status });
  }
}
