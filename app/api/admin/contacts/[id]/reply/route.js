import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import Contact from '@/models/Contact';
import transporter from '@/lib/emailService';

export async function POST(request, { params }) {
    try {
        await requireAdmin();
        await connectDB();

        const { id } = params;
        const payload = await request.json();
        const { subject, body } = payload;

        const contact = await Contact.findById(id);
        if (!contact) {
            return NextResponse.json({ success: false, message: 'Contact not found' }, { status: 404 });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: contact.email,
            subject: subject || `Re: ${contact.name}`,
            html: body || ''
        };

        // attempt to send
        try {
            const info = await transporter.sendMail(mailOptions);
            // update contact status/notes
            contact.status = 'replied';
            const note = `Replied via admin UI on ${new Date().toISOString()}`;
            contact.adminNotes = contact.adminNotes ? `${contact.adminNotes}\n${note}` : note;
            await contact.save();

            return NextResponse.json({ success: true, message: 'Reply sent', info, contact });
        } catch (sendError) {
            console.error('Failed to send admin reply:', sendError);
            return NextResponse.json({ success: false, message: 'Failed to send reply', error: sendError.message }, { status: 500 });
        }

    } catch (error) {
        const status = error?.status || 500;
        console.error('Error in admin reply route:', error);
        return NextResponse.json({ success: false, message: error?.message || 'Internal error' }, { status });
    }
}
