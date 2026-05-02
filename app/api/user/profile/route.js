import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function PATCH(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const name = String(body?.name || '').trim();

        if (!name) {
            return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findByIdAndUpdate(userId, { name }, { new: true });

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        try {
            const client = await clerkClient();
            const [firstName, ...lastNameParts] = name.split(' ');
            await client.users.updateUser(userId, {
                firstName,
                lastName: lastNameParts.join(' ') || undefined
            });
        } catch (clerkError) {
            console.warn('Could not update Clerk name:', clerkError);
        }

        return NextResponse.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                imageUrl: user.imageUrl
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ success: false, message: error.message || 'Failed to update profile' }, { status: 500 });
    }
}
