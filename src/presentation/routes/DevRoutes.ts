import { Router } from "express";
import { AuthController } from "@/presentation/controllers/AuthController";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { MailService } from "@/infrastructure/mail/MailService";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { GoogleAuthController } from "../controllers/GoogleAuthController";
import { LinkedInAuthController } from "../controllers/LinkedInAuthController";
import { DevAuthController } from "../controllers/DevAuthController";

import multer from 'multer';
import { S3Service } from "@/infrastructure/services/S3_Service";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
      console.log("Processing file:", file.fieldname);
      
      if (file.fieldname === 'profilePicture') {
          if (!file.mimetype.startsWith('image/')) {
              return cb(new Error('Only images are allowed for profile picture'));
          }
          return cb(null, true);
      } 
      
      if (file.fieldname === 'resume') {
          const allowedMimeTypes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          if (!allowedMimeTypes.includes(file.mimetype)) {
              return cb(new Error('Only PDF and Word documents are allowed for resume'));
          }
          return cb(null, true);
      }

      return cb(null, false);
  }
});

const devRouter = Router();

const userRepository = new UserRepository();
const otpRepository = new OTPRepository();
const devRepository = new DeveloperRepository()
const mailService = new MailService();
const s3Service = new S3Service()


const devAuthController = new DevAuthController(userRepository, otpRepository,devRepository, mailService, s3Service);

const googleAuthController = new GoogleAuthController(userRepository);
const linkedInAuthController = new LinkedInAuthController(userRepository)

devRouter.post('/auth/register', async (req, res) => {
    await devAuthController.register(req, res);
});

devRouter.post('/auth/verify-otp', async (req, res) => {
  await devAuthController.verifyOTP(req, res);
});

devRouter.post('/auth/resend-otp', async (req, res) => {
  await devAuthController.resendOTP(req, res);
})

devRouter.use('/auth/dev-request', (req, res, next) => {
  console.log('Request received at /auth/dev-request');
  console.log('Headers:', req.headers);
  next();
});

devRouter.post('/auth/dev-request', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files received:', req.files);
    
    if (!req.files) {
        console.log('No files were uploaded');
    }
    
    await devAuthController.devRequest(req, res);
} catch (error: any) {
    console.error('Error in route handler:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Error processing request',
        error: error.message 
    });
    }
})

devRouter.post('/auth/login', async (req, res) => {
  await devAuthController.login(req, res);
})

// devRouter.post('/logout', async (req, res) => {
//   await authController.logout(req, res);
// })

// devRouter.post('/forgot-password', async (req, res) => {
//   await authController.forgotPassword(req, res);
// })

// devRouter.post('/reset-password', async (req, res) => {
//   await authController.resetPassword(req, res)
// })

// devRouter.post('/google', async (req, res) => { 
//   await googleAuthController.googleLogin(req, res);
// })

// devRouter.post('/linkedin', async (req, res) => {
//   await linkedInAuthController.linkedInLogin(req, res);
// })

export default devRouter; 