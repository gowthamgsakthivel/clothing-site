import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify email connection
export async function verifyEmailConnection() {
    try {
        await transporter.verify();
        // console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email connection error:', error);
        return false;
    }
}

// Send email to admin when new contact form is submitted
export async function sendContactNotification(contactData) {
    const { name, email, message } = contactData;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `🆕 New Contact Form Submission from ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Contact Message</h1>
                    <p style="color: white; margin: 5px 0;">Sparrow Sports</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333; margin-bottom: 20px;">Contact Details:</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #333; margin-top: 0;">Message:</h3>
                        <p style="line-height: 1.6; color: #555;">${message}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="mailto:${email}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reply to Customer</a>
                    </div>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center;">
                    <p style="color: #ccc; margin: 0;">This email was sent from your Sparrow Sports contact form</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        // console.log('✅ Admin notification sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send admin notification:', error);
        return { success: false, error: error.message };
    }
}

// Send auto-reply to customer
export async function sendAutoReply(customerEmail, customerName) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: '✅ Thank you for contacting Sparrow Sports!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Thank You!</h1>
                    <p style="color: white; margin: 5px 0;">Sparrow Sports</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333;">Hi ${customerName}! 👋</h2>
                    
                    <p style="line-height: 1.6; color: #555;">
                        Thank you for reaching out to us! We've received your message and our team will get back to you within 24 hours.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <p style="margin: 0; color: #333;"><strong>What happens next?</strong></p>
                        <ul style="color: #555; line-height: 1.6;">
                            <li>Our customer support team will review your message</li>
                            <li>We'll respond within 24 hours during business days</li>
                            <li>For urgent matters, feel free to call us at +91 89408 85505</li>
                        </ul>
                    </div>
                    
                    <p style="line-height: 1.6; color: #555;">
                        In the meantime, feel free to explore our latest sports collection on our website!
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://yourdomain.com" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Browse Products</a>
                    </div>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center;">
                    <p style="color: #ccc; margin: 5px 0;">📞 +91 89408 85505</p>
                    <p style="color: #ccc; margin: 5px 0;">✉️ sparrowsports@gmail.com</p>
                    <p style="color: #ccc; margin: 5px 0;">📍 Namakkal, India</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        // console.log('✅ Auto-reply sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send auto-reply:', error);
        return { success: false, error: error.message };
    }
}

export default transporter;