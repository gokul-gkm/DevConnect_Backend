import { Router } from "express";
import { AuthController } from "@/presentation/controllers/AuthController";
import { GoogleAuthController } from "../controllers/GoogleAuthController";
import { TYPES } from "@/types/types";
import { container } from "@/infrastructure/config/inversify.config";

const authRouter = Router();

const authController = container.get<AuthController>(TYPES.AuthController);
const googleAuthController = container.get<GoogleAuthController>(TYPES.GoogleAuthController);

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

authRouter.post('/google', async (req, res) => { 
  await googleAuthController.googleLogin(req, res);
})

authRouter.get('/refresh-token', async (req, res) => {
  await authController.setNewToken(req, res)
})

export default authRouter; 