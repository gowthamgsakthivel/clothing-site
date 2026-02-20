import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import Contact from '@/models/Contact';

export async function GET(request) {
    try {
        await requireAdmin();

        await connectDB();

        // Get status filter from query
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const contacts = await Contact.find(query).sort({ submittedAt: -1 });

        return NextResponse.json({
            success: true,
            contacts
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('Error fetching contacts:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to fetch contacts'
        }, { status });
    }
}
