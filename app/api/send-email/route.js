import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        // We accept 'token' for the verify_email step, but ignore it for others
        const { email, fullName, type, token } = await req.json();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
            tls: { rejectUnauthorized: false }
        });

        const brandColor = "#db2777"; // Rotaract Pink

        // Get Base URL (defaults to localhost for dev, assumes rotaractsusl.org for prod)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://rotaractsusl.org';

        let subject = "";
        let htmlContent = "";

        // --- 1. EMAIL VERIFICATION (Step 1: User clicks this when joining) ---
        if (type === 'verify_email') {
            const verifyLink = `${baseUrl}/verify-email?token=${token}`;
            subject = "Verify your email - Rotaract Club of SUSL";
            htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${brandColor}; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Verify Email Address</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Hello <strong>${fullName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">
                        Thank you for applying to join Rotaract! Before we send your application to the Board, we need to verify your email address.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyLink}" style="background-color: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Confirm My Email
                        </a>
                    </div>
                </div>
            </div>`;
        }

        // --- 2. WELCOME EMAIL (Step 2: Sent immediately when Admin approves) ---
        else if (type === 'approve') {
            // Link directs to the Login page (or Home)
            const targetLink = `${baseUrl}/login`;

            subject = "🎉 Welcome to the Rotaract Club of SUSL!";
            htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${brandColor}; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">You are now a Member!</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Dear <strong>${fullName}</strong>,</p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Congratulations! Your application has been reviewed and <strong>APPROVED</strong> by the Executive Committee.
                    </p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Your account is now fully active. You can log in to the member portal to view upcoming projects, connect with the community, and start your journey.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${targetLink}" style="background-color: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Login to Portal
                        </a>
                    </div>

                    <p style="font-size: 14px; color: #666; text-align: center;">
                        Visit us at: <a href="https://rotaractsusl.org" style="color: ${brandColor};">rotaractsusl.org</a>
                    </p>
                </div>
            </div>`;
        }

        // --- 3. REJECTION TEMPLATE ---
        else if (type === 'reject') {
            subject = "Update on your Rotaract Membership Application";
            htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #333; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Application Status</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Dear <strong>${fullName}</strong>,</p>
                    <div style="background-color: #fff0f2; border-left: 4px solid #db2777; padding: 15px; margin: 20px 0;">
                        <p style="color: #991b1b; margin: 0; font-weight: bold;">Application Declined</p>
                    </div>
                    <p style="font-size: 14px; color: #555;">
                        Unfortunately, we could not approve your application at this time. Please contact the administrator if you believe this is an error.
                    </p>
                </div>
            </div>`;
        }

        // Send the Email
        await transporter.sendMail({
            from: `"Rotaract Admin" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: subject,
            html: htmlContent,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Email Error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}