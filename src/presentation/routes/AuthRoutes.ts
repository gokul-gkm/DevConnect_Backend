import { Router } from "express";
import { AuthController } from "@/presentation/controllers/AuthController";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { MailService } from "@/infrastructure/mail/MailService";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";

const authRouter = Router();

const userRepository = new UserRepository();
const otpRepository = new OTPRepository();
const mailService = new MailService();


const authController = new AuthController(userRepository, otpRepository, mailService);

authRouter.post('/register', async (req, res) => {
    await authController.register(req, res);
  });

authRouter.post('/verify-otp', async (req, res) => {
  await authController.verifyOTP(req, res);
});

authRouter.post('/resend-otp', async (req, res) => {
  await authController.resendOTP(req, res);
})

authRouter.post('/login', async (req, res) => {
  await authController.login(req, res);
})

authRouter.post('/logout', async (req, res) => {
  await authController.logout(req, res);
})

authRouter.post('/forgot-password', async (req, res) => {
  await authController.forgotPassword(req, res);
})

authRouter.post('/reset-password', async (req, res) => {
  await authController.resetPassword(req, res)
})

export default authRouter; 