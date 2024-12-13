import crypto from 'crypto';

export const generateOTP = (): string => {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
        otp += digits[bytes[i] % digits.length];
    }
    return otp;    
}