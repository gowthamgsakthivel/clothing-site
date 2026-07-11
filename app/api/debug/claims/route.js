import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      message: 'Not found'
    }, { status: 404 });
  }

  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required.'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      userId,
      sessionClaims
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
