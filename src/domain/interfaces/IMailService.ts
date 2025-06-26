export interface IMailService {
  sendOTP(email: string, otp: string): Promise<void>;
  sendPasswordResetLink(email: string, resetLink: string): Promise<void>;
  sendDeveloperApprovalMail(email: string, username: string): Promise<void>;
  sendDeveloperRejectionMail(email: string, username: string, reason: string): Promise<void>;
  sendSessionApprovalEmail(email: string, username: string, sessionDetails: any): Promise<void>;
  sendSessionRejectionEmail(email: string, username: string, sessionDetails: any, rejectionReason: string): Promise<void>;
  sendPaymentConfirmationEmail(email: string, username: string, sessionDetails: any): Promise<void>;
} 