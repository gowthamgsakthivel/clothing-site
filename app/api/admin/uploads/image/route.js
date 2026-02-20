import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({
        success: false,
        message: 'Image is required'
      }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'sparrow-sports/products',
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url
    });
  } catch (error) {
    const normalized = buildError(error);
    return NextResponse.json({
      success: false,
      message: normalized.message
    }, { status: normalized.status || 500 });
  }
}
