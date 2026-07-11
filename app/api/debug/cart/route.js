import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
            success: false,
            message: 'Not found'
        }, { status: 404 });
    }

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({
            success: false,
            message: 'Authentication required.'
        }, { status: 401 });
    }

    // This endpoint can be used to test cart parsing logic
    const testCartItems = {
        "67123abc_black_M": 2,
        "67123abc_white_L": 1,
        "67456def_#FF0000": 1,
        "67789ghi": 1
    };

    const results = Object.keys(testCartItems).map((itemKey) => {
        const keyParts = itemKey.split('_');
        const productId = keyParts[0];
        const color = keyParts[1] || null;
        const size = keyParts[2] || null;

        return {
            itemKey,
            productId,
            color,
            size,
            quantity: testCartItems[itemKey],
            parsed: `Product: ${productId}, Color: ${color || 'none'}, Size: ${size || 'none'}`
        };
    });

    return NextResponse.json({
        success: true,
        message: "Cart parsing test results",
        testData: testCartItems,
        parsedResults: results
    });
}