import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export class MailService {
    async sendOTP(email: string, otp: string): Promise<void> {
        if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
            throw new Error('Email credentials are not set');
        }
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: `DevConnect <${process.env.EMAIL}>`,
            to: email,
            subject: 'Your DevConnect Verification Code',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>DevConnect Verification</title>
                <style>
                    body { margin: 0; padding: 0; width: 100% !important; }
                    table { border-collapse: collapse; }
                    a { color: #0068A5; text-decoration: none; }
                    img { border: 0; }
                    
                    @media screen and (max-width: 600px) {
                        .responsive-table { width: 100% !important; }
                        .mobile-center { text-align: center !important; }
                    }
                </style>
            </head>
            <body style="margin:0; padding:0; background-color:#f4f4f4;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f4;">
                    <tr>
                        <td align="center" style="padding:20px 0;">
                            <table 
                                border="0" 
                                cellpadding="0" 
                                cellspacing="0" 
                                width="600" 
                                class="responsive-table" 
                                style="width:600px; max-width:600px; background-color:#ffffff; box-shadow:0 2px 4px rgba(0,0,0,0.1);"
                            >
                                <!-- Header -->
                                <tr>
                                    <td style="background-color:#f8f9fa; padding:20px; text-align:center; border-bottom:1px solid #e0e0e0; border-radius: 50%">
                                        <img 
                                            src="https://i.imghippo.com/files/dhlN2945uw.png" 
                                            alt="DevConnect Logo" 
                                            width="50" 
                                            style="max-height:50px; margin:0 auto;border-radius: 50%"
                                        >
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding:20px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;">
                                        <h1 style="color:#1A1A1A; font-size:24px; margin-bottom:20px; text-align:center;">
                                            Verify Your Email
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #4285F4; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Welcome to DevConnect!</strong> Complete your registration by entering the code below.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; text-align:center; margin-bottom:30px;">
                                            To verify your email address, please use the following One-Time Password (OTP):
                                        </p>
                                        
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                                            <tr>
                                                <td align="center">
                                                    <div style="background-color:#f8f9fa; border:2px solid #e0e0e0; display:inline-block; padding:15px 30px; font-size:32px; font-weight:600; letter-spacing:10px; border-radius:8px; color:#2c3e50;">
                                                        ${otp}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color:#666666; text-align:center; margin-bottom:20px; font-size:14px;">
                                            This code is valid for <strong>10 minutes</strong>. 
                                            Do not share this code with anyone.
                                        </p>
                                        
                                        <p style="color:#666666; text-align:center; font-size:12px; margin-top:20px;">
                                            If you did not request this verification, please ignore this email or 
                                            <a href="mailto:support@devconnect.com" style="color:#4285F4;">contact support</a>.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color:#f8f9fa; padding:20px; text-align:center; border-top:1px solid #e0e0e0; color:#666666; font-size:12px;">
                                        © ${new Date().getFullYear()} DevConnect, Inc. All rights reserved.<br>
                                        <a href="#" style="color:#666666; margin:0 10px;">Privacy Policy</a> | 
                                        <a href="#" style="color:#666666; margin:0 10px;">Terms of Service</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `,
        };
        try {
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
        if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
            throw new Error('Email credentials are not set');
        }
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: `DevConnect Security <${process.env.EMAIL}>`,
            to: email,
            subject: 'Reset Your DevConnect Password',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Reset Your Password</title>
                <style>
                    body { margin: 0; padding: 0; width: 100% !important; }
                    table { border-collapse: collapse; }
                    a { color: #0068A5; text-decoration: none; }
                    img { border: 0; }
                    
                    @media screen and (max-width: 600px) {
                        .responsive-table { width: 100% !important; }
                        .mobile-center { text-align: center !important; }
                    }
                </style>
            </head>
            <body style="margin:0; padding:0; background-color:#f4f4f4;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f4;">
                    <tr>
                        <td align="center" style="padding:20px 0;">
                            <table 
                                border="0" 
                                cellpadding="0" 
                                cellspacing="0" 
                                width="600" 
                                class="responsive-table" 
                                style="width:600px; max-width:600px; background-color:#ffffff; box-shadow:0 2px 4px rgba(0,0,0,0.1);"
                            >
                                <!-- Header -->
                                <tr>
                                    <td style="background-color:#f8f9fa; padding:20px; text-align:center; border-bottom:1px solid #e0e0e0; border-radius:50%">
                                        <img 
                                            src="https://i.imghippo.com/files/dhlN2945uw.png" 
                                            alt="DevConnect Logo" 
                                            width="50" 
                                            style="max-height:50px; margin:0 auto; border-radius: 50%"
                                        >
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding:20px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;">
                                        <h1 style="color:#1A1A1A; font-size:24px; margin-bottom:20px; text-align:center;">
                                            Reset Your Password
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #4285F4; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Security Notice:</strong> A password reset was requested for your account.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; text-align:center; margin-bottom:30px;">
                                            We received a request to reset the password for your DevConnect account. 
                                            Click the button below to set a new password within the next 15 minutes.
                                        </p>
                                        
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                                            <tr>
                                                <td align="center">
                                                    <a 
                                                        href="${resetLink}" 
                                                        style="background-color:#4285F4; color:white; padding:12px 24px; border-radius:4px; display:inline-block; font-weight:bold; text-decoration:none;"
                                                    >
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color:#666666; text-align:center; margin-bottom:15px;">
                                            If the button doesn't work, copy and paste this link:
                                        </p>
                                        
                                        <div style="background-color:#f1f3f4; border-radius:4px; padding:10px; margin:0 20px 30px; word-break:break-all; text-align:center; font-family:monospace; color:#5f6368;">
                                            ${resetLink}
                                        </div>
                                        
                                        <p style="color:#666666; text-align:center; font-size:12px; margin-top:20px;">
                                            If you did not request a password reset, please ignore this email or contact support if you have concerns.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color:#f8f9fa; padding:20px; text-align:center; border-top:1px solid #e0e0e0; color:#666666; font-size:12px;">
                                        © ${new Date().getFullYear()} DevConnect, Inc. All rights reserved.<br>
                                        <a href="#" style="color:#666666; margin:0 10px;">Privacy Policy</a> | 
                                        <a href="#" style="color:#666666; margin:0 10px;">Terms of Service</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `,
        };
        try {
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
}