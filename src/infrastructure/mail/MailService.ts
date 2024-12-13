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
            from: process.env.EMAIL,
            to: email,
            subject: 'DevConnect Registration Verification',
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DevConnect Verification</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        padding: 30px;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                        position: relative;
                    }
                    .logo {
                        margin-right: 15px;
                        display: flex;
                        align-items: center;
                    }
                    .logo img {
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 2px solid #f0f0f0;
                    }
                    .welcome-title {
                        text-align: center;
                        margin: 0;
                    }
                    .content {
                        text-align: center;
                    }
                    .verification-code {
                        background-color: #f4f4f4;
                        border: 2px solid #e0e0e0;
                        display: inline-block;
                        padding: 15px 30px;
                        font-size: 28px;
                        font-weight: 600;
                        letter-spacing: 8px;
                        margin: 20px 0;
                        border-radius: 6px;
                        color: #2c3e50;
                    }
                    .footer {
                        font-size: 12px;
                        color: #777;
                        margin-top: 20px;
                        text-align: center;
                    }
                    @media screen and (max-width: 600px) {
                        .header {
                            flex-direction: column;
                            text-align: center;
                        }
                        .logo {
                            margin-right: 0;
                            margin-bottom: 10px;
                        }
                        .verification-code {
                            font-size: 22px;
                            letter-spacing: 4px;
                            padding: 10px 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <img src="https://i.imghippo.com/files/dhlN2945uw.png" alt="DevConnect Logo" />
                        </div>
                        <h1 class="welcome-title" style="font-size: 24px;">Welcome to DevConnect</h1>
                    </div>
                    
                    <div class="content">
                        <p style="margin-bottom: 25px;">
                            Hi,<br>
                            Thank you for joining <strong>DevConnect</strong>! To complete your registration, use the OTP below:
                        </p>
                        
                        <div class="verification-code">
                            ${otp}
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">
                            This code is valid for the next <strong>10 minutes</strong>. 
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                    
                    <div class="footer">
                        © ${new Date().getFullYear()} DevConnect. All rights reserved.
                        <br>
                        If you're having trouble, contact connect.devconnect@gmail.com
                    </div>
                </div>
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