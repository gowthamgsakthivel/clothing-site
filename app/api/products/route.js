import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import ProductV2 from '@/models/v2/Product';
import { products as sampleProducts } from '@/assets/productData';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) return NextResponse.json({ success: false, products: [] });

    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);

    // Try DB lookup for ObjectId-like ids
    await connectDB();
    const objectIdLike = ids.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    let results = [];
    if (objectIdLike.length) {
      const docs = await ProductV2.find({ _id: { $in: objectIdLike } }).lean();
      results = docs.map(d => ({
        id: d._id,
        name: d.name,
        description: d.description,
        imgSrc: null
      }));
    }

    // For non-ObjectId ids, try matching numeric ids against sampleProducts
    const numericIds = ids.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
    if (numericIds.length) {
      const mapped = numericIds.map(id => {
        const n = Number(id);
        return sampleProducts.find(p => p.id === n);
      }).filter(Boolean).map(p => ({ id: p.id, name: p.name, description: p.description, imgSrc: p.imgSrc }));
      results = [...results, ...mapped];
    }

    return NextResponse.json({ success: true, products: results });
  } catch (err) {
    console.error('Products API error', err);
    return NextResponse.json({ success: false, message: 'Failed to load products' }, { status: 500 });
  }
}
