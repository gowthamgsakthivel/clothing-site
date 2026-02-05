import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const authSeller = async (userId) => {
    try {
        if (!userId) {
            console.error("No userId provided to authSeller");
            throw new Error("No userId provided");
        }

        // console.log(`👤 Seller auth check for user: ${userId}`);

        // In development mode, always return true for easier testing
        if (process.env.NODE_ENV === 'development') {
            // console.log(`🔧 Development mode: All authenticated users are treated as sellers`);
            return true;
        }

        try {
            // In production, check user role in Clerk
            // Note: clerkClient is already initialized by Next.js
            const user = await clerkClient.users.getUser(userId);

            if (!user) {
                console.error("User not found with ID:", userId);
                throw new Error("User not found");
            }

            // Check if user has seller role in metadata
            const isSeller = user.publicMetadata && user.publicMetadata.role === 'seller';
            // console.log(`🛡️ User is a seller: ${isSeller}`);

            return isSeller;
        } catch (clerkError) {
            console.error(`❌ Clerk API error: ${clerkError.message}`);
            // In production, don't allow access if Clerk API fails
            throw clerkError;
        }
    } catch (error) {
        console.error("Error in authSeller:", error);
        // Important: Don't return a Response object from a function that's expected to return a boolean
        // Instead, throw the error to be handled by the caller
        throw error;
    }
}

export default authSeller;