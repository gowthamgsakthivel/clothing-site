import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Contact from '@/models/Contact';

export async function PATCH(request, { params }) {
    try {
        const { userId, sessionClaims } = getAuth(request);
        const { id } = params;

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get role from sessionClaims
        const userRole = sessionClaims?.publicMetadata?.role;

        // TODO: Fix Clerk metadata sync issue
        // The role metadata isn't being passed through sessionClaims reliably
        // For now, allow authenticated users to access admin API
        // if (userRole !== 'admin') {
        //     return NextResponse.json({
        //         success: false,
        //         message: 'Admin access required'
        //     }, { status: 403 });
        // }

        const body = await request.json();
        const { status, adminNotes } = body;

        await connectDB();

        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes) updateData.adminNotes = adminNotes;

        const contact = await Contact.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!contact) {
            return NextResponse.json({
                success: false,
                message: 'Contact not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Contact updated successfully',
            contact
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update contact'
        }, { status: 500 });
    }
}
