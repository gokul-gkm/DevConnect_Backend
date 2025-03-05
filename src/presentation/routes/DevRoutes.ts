import { Router } from "express";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { MailService } from "@/infrastructure/mail/MailService";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { GoogleAuthController } from "../controllers/GoogleAuthController";
import { LinkedInAuthController } from "../controllers/LinkedInAuthController";
import { DevAuthController } from "../controllers/DevAuthController";

import { S3Service } from "@/infrastructure/services/S3_Service";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";

import { upload } from "@/utils/multer";
import { DevController } from "../controllers/DevController";
import { authMiddleware } from "../middleware/authMiddleware";
import { ProjectRepository } from "@/infrastructure/repositories/ProjectRepository";
import { WalletRepository } from "@/infrastructure/repositories/WalletRepository";
import { StatusCodes } from "http-status-codes";

const devRouter = Router();

const userRepository = new UserRepository();
const otpRepository = new OTPRepository();
const devRepository = new DeveloperRepository()
const projectRepository = new ProjectRepository()
const walletRepository = new WalletRepository()
const mailService = new MailService();
const s3Service = new S3Service()


const devAuthController = new DevAuthController(userRepository, otpRepository, devRepository, mailService, s3Service);

const devController = new DevController(userRepository, devRepository,projectRepository,s3Service)

const googleAuthController = new GoogleAuthController(userRepository, walletRepository);
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
  console.log('Headers:', req.headers);
  next();
});

devRouter.post('/auth/dev-request', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    
    if (!req.files) {
        console.log('No files were uploaded');
    }
    
    await devAuthController.devRequest(req, res);
} catch (error: any) {
    console.error('Error in route handler:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: 'Error processing request',
        error: error.message 
    });
    }
})

devRouter.post('/auth/login', async (req, res) => {
  await devAuthController.login(req, res);
})

devRouter.get('/profile', authMiddleware, (req, res, next) => {
  devController.getProfile(req, res).catch(next);
});

devRouter.put('/profile/update', 
    authMiddleware, 
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'resume', maxCount: 1 }
  ]),
    (req, res, next) => {
        devController.updateProfile(req, res).catch(next);
    }
);

devRouter.post( '/add-project',
  authMiddleware,
  upload.single('coverImage'),
  (req, res, next) => {
    devController.addProject(req,res).catch(next);
})

devRouter.get('/projects', authMiddleware, (req, res) => {
  devController.getDeveloperProjects(req, res)
})

devRouter.get(
  '/projects/:projectId',
  authMiddleware,
  (req, res) => {
    devController.getProject(req, res)
  }
);

devRouter.put(
  '/project/edit/:projectId',
  authMiddleware,
  upload.single('coverImage'),
  (req, res, next) => {
    devController.updateProject(req,res).catch(next);
}
);

devRouter.delete(
  '/project/remove/:projectId',
  authMiddleware,
  (req, res) => {
    devController.deleteProject(req, res)
  }
);


export default devRouter; 