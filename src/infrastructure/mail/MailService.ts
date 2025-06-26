import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { IMailService } from '../../domain/interfaces/IMailService';
dotenv.config();

export class MailService implements IMailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
            throw new Error('Email credentials are not set');
        }
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendOTP(email: string, otp: string): Promise<void> {

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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendDeveloperApprovalMail(email: string, username: string): Promise<void> {

        const mailOptions = {
            from: `DevConnect <${process.env.EMAIL}>`,
            to: email,
            subject: 'Welcome to DevConnect - Developer Application Approved!',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Developer Application Approved</title>
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
                                            Congratulations! 🎉
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #4285F4; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Welcome to DevConnect!</strong> Your developer application has been approved.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Dear ${username},
                                        </p>

                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            We're excited to inform you that your application to join DevConnect as a developer has been approved! 
                                            You can now access all developer features and start accepting student session requests.
                                        </p>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                                            <tr>
                                                <td align="center">
                                                    <a 
                                                        href="${process.env.FRONTEND_URL}/login" 
                                                        style="background-color:#4285F4; color:white; padding:12px 24px; border-radius:4px; display:inline-block; font-weight:bold; text-decoration:none;"
                                                    >
                                                        Access Your Dashboard
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <p style="color:#333333; line-height:1.6; margin:0 0 10px 0;">
                                                <strong>Next Steps:</strong>
                                            </p>
                                            <ul style="color:#333333; line-height:1.6; margin:0; padding-left:20px;">
                                                <li>Complete your developer profile</li>
                                                <li>Set up your portfolio</li>
                                                <li>Browse available projects</li>
                                                <li>Start connecting with developers</li>
                                            </ul>
                                        </div>
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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendDeveloperRejectionMail(email: string, username: string, reason: string): Promise<void> {
        const mailOptions = {
            from: `DevConnect <${process.env.EMAIL}>`,
            to: email,
            subject: 'Update on Your DevConnect Developer Application',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Application Status Update</title>
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
                                            Application Status Update
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #ea4335; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Important Notice:</strong> Update regarding your developer application.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Dear ${username},
                                        </p>

                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Thank you for your interest in joining DevConnect as a developer. After careful review of your application, 
                                            we regret to inform you that we are unable to approve your request at this time.
                                        </p>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <p style="color:#333333; line-height:1.6; margin:0 0 10px 0;">
                                                <strong>Reason for this decision:</strong>
                                            </p>
                                            <p style="color:#333333; line-height:1.6; margin:0; padding:10px; background-color:#ffffff; border-radius:4px;">
                                                ${reason}
                                            </p>
                                        </div>

                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            You are welcome to apply again in the future with updated qualifications or additional information. 
                                            If you have any questions, please don't hesitate to contact our support team.
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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendSessionApprovalEmail(email: string, username: string, sessionDetails: any): Promise<void> {
        const mailOptions = {
            from: `DevConnect <${process.env.EMAIL}>`,
            to: email,
            subject: 'Session Approved - Payment Required',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Session Approval</title>
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
                                            Session Approved! 🎉
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #4285F4; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Action Required:</strong> Complete payment to confirm your session.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Dear ${username},
                                        </p>

                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Great news! Your session request has been approved. Here are the details:
                                        </p>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <table style="width:100%; color:#333333;">
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Date:</strong></td>
                                                    <td>${new Date(sessionDetails.date).toLocaleDateString()}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Time:</strong></td>
                                                    <td>${sessionDetails.time}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Duration:</strong></td>
                                                    <td>${sessionDetails.duration} minutes</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Amount:</strong></td>
                                                    <td>$${sessionDetails.amount}</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                                            <tr>
                                                <td align="center">
                                                    <a 
                                                        href="${process.env.FRONTEND_URL}/payment/${sessionDetails.id}" 
                                                        style="background-color:#4285F4; color:white; padding:12px 24px; border-radius:4px; display:inline-block; font-weight:bold; text-decoration:none;"
                                                    >
                                                        Complete Payment
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="color:#666666; text-align:center; font-size:12px; margin-top:20px;">
                                            Please complete the payment within 30 minutes to secure your session slot.
                                            After this time, the slot may become available to other users.
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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendSessionRejectionEmail(email: string, username: string, sessionDetails: any, rejectionReason: string): Promise<void> {
        const mailOptions = {
            from: `DevConnect <${process.env.EMAIL}>`,
            to: email,
            subject: 'Session Request Update',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Session Update</title>
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
                                            Session Request Update
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #ea4335; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Notice:</strong> Your session request could not be accommodated.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Dear ${username},
                                        </p>

                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            We regret to inform you that your session request for the following slot could not be accommodated:
                                        </p>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <table style="width:100%; color:#333333;">
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Date:</strong></td>
                                                    <td>${new Date(sessionDetails.date).toLocaleDateString()}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Time:</strong></td>
                                                    <td>${sessionDetails.time}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Duration:</strong></td>
                                                    <td>${sessionDetails.duration} minutes</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <p style="color:#333333; line-height:1.6; margin:0 0 10px 0;">
                                                <strong>Reason:</strong>
                                            </p>
                                            <p style="color:#333333; line-height:1.6; margin:0; padding:10px; background-color:#ffffff; border-radius:4px;">
                                                ${rejectionReason}
                                            </p>
                                        </div>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                                            <tr>
                                                <td align="center">
                                                    <a 
                                                        href="${process.env.FRONTEND_URL}/book-session" 
                                                        style="background-color:#4285F4; color:white; padding:12px 24px; border-radius:4px; display:inline-block; font-weight:bold; text-decoration:none;"
                                                    >
                                                        Book Another Session
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="color:#666666; text-align:center; font-size:12px; margin-top:20px;">
                                            Feel free to browse other available time slots or contact our support team if you need assistance.
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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendPaymentConfirmationEmail(email: string, username: string, sessionDetails: any): Promise<void> {
        const mailOptions = {
            from: `DevConnect <${process.env.EMAIL}>`,
            to: email,
            subject: 'Session Payment Confirmed',
            html: `
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title>Payment Confirmation</title>
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
                                            Payment Confirmed! 🎉
                                        </h1>
                                        
                                        <div style="background-color:#f1f3f4; border-left:4px solid #34A853; padding:15px; margin-bottom:25px; color:#5f6368;">
                                            <strong>Success:</strong> Your session is now confirmed and scheduled.
                                        </div>
                                        
                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Dear ${username},
                                        </p>

                                        <p style="color:#333333; line-height:1.6; margin-bottom:20px;">
                                            Thank you for your payment. Your session has been successfully scheduled:
                                        </p>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <table style="width:100%; color:#333333;">
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Session ID:</strong></td>
                                                    <td>#${sessionDetails.id}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Date:</strong></td>
                                                    <td>${new Date(sessionDetails.date).toLocaleDateString()}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Time:</strong></td>
                                                    <td>${sessionDetails.time}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Duration:</strong></td>
                                                    <td>${sessionDetails.duration} minutes</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Developer:</strong></td>
                                                    <td>${sessionDetails.developerName}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;"><strong>Amount Paid:</strong></td>
                                                    <td>$${sessionDetails.amount}</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <div style="background-color:#f8f9fa; border-radius:4px; padding:15px; margin-bottom:25px;">
                                            <p style="color:#333333; line-height:1.6; margin:0 0 10px 0;">
                                                <strong>Next Steps:</strong>
                                            </p>
                                            <ul style="color:#333333; line-height:1.6; margin:0; padding-left:20px;">
                                                <li>Check your calendar invitation</li>
                                                <li>Prepare any questions or materials for the session</li>
                                                <li>Test your audio/video setup before the session</li>
                                                <li>Join the session 5 minutes early</li>
                                            </ul>
                                        </div>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:30px;">
                                            <tr>
                                                <td align="center">
                                                    <a 
                                                        href="${process.env.FRONTEND_URL}/sessions/${sessionDetails.id}" 
                                                        style="background-color:#4285F4; color:white; padding:12px 24px; border-radius:4px; display:inline-block; font-weight:bold; text-decoration:none;"
                                                    >
                                                        View Session Details
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="color:#666666; text-align:center; font-size:12px; margin-top:20px;">
                                            Need to reschedule? Please contact us at least 24 hours before your session.
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
            await this.transporter.verify();
            console.log('SMTP connection verified. Sending mail...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.response}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

}