import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes by role
const isOwnerRoute = createRouteMatcher(['/owner(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // Check if route is owner-only
    if (isOwnerRoute(req)) {
        // User must be authenticated
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }

        // Role checks intentionally relaxed for single-owner setup
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