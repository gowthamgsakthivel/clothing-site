import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import Contact from '@/models/Contact';

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        await requireAdmin();

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
        const status = error.status || 500;
        console.error('Error updating contact:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to update contact'
        }, { status });
    }
}
