import jwt from "jsonwebtoken";

const generatePasswordResetToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, process.env.PASSWORD_RESET_SECRET as string, { expiresIn: '15m' });
}

export { generatePasswordResetToken}
