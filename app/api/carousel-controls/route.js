import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import CarouselControls from '@/models/CarouselControls';
import { requireAdmin } from '@/lib/authRoles';
import { getDefaultCarouselControls, CAROUSEL_PAGES } from '@/lib/carouselDefaults';

async function loadControls() {
  let doc = await CarouselControls.findOne().lean();
  if (!doc) {
    const defaults = getDefaultCarouselControls();
    doc = await CarouselControls.create(defaults);
    return doc.toObject();
  }

  return doc;
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const controls = await loadControls();

    if (page && CAROUSEL_PAGES.includes(page)) {
      return NextResponse.json({ success: true, page, slides: controls?.[page] || [] });
    }

    return NextResponse.json({ success: true, controls });
  } catch (error) {
    console.error('Carousel controls GET error', error);
    return NextResponse.json({ success: false, message: 'Failed to load carousel controls' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await req.json();
    const controls = await loadControls();

    CAROUSEL_PAGES.forEach((page) => {
      if (body?.[page] !== undefined) {
        controls[page] = body[page];
      }
    });

    const saved = await CarouselControls.findOneAndUpdate({}, controls, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    return NextResponse.json({ success: true, controls: saved });
  } catch (error) {
    console.error('Carousel controls PUT error', error);
    const status = error.status || 500;
    return NextResponse.json({ success: false, message: error.message || 'Failed to save carousel controls' }, { status });
  }
}
