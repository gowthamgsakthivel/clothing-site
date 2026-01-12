import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes by role
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSellerRoute = createRouteMatcher(['/seller(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();

    // Check if route is admin-only
    if (isAdminRoute(req)) {
        // User must be authenticated
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }

        // User must have admin role - but currently sessionClaims doesn't have it reliably
        // API will do the proper role check using clerkClient
        // const userRole = sessionClaims?.publicMetadata?.role;
        // if (userRole !== 'admin') {
        //     return NextResponse.redirect(new URL('/', req.url));
        // }
    }

    // Check if route is seller-only
    if (isSellerRoute(req)) {
        // User must be authenticated
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }

        // User must have seller or admin role - but currently sessionClaims doesn't have it reliably
        // API will do the proper role check using clerkClient
        // const userRole = sessionClaims?.publicMetadata?.role;
        // if (userRole !== 'seller' && userRole !== 'admin') {
        //     return NextResponse.redirect(new URL('/', req.url));
        // }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};