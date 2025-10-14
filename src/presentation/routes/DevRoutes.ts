import { Router } from "express";
import { GoogleAuthController } from "../controllers/GoogleAuthController";
import { DevAuthController } from "../controllers/DevAuthController";
import { upload } from "@/utils/multer";
import { DevController } from "../controllers/DevController";
import { authMiddleware } from "../middleware/authMiddleware";
import { StatusCodes } from "http-status-codes";
import { autherization } from "../middleware/autherization";
import { TYPES } from "@/types/types";
import { container } from "@/infrastructure/config/inversify.config";

const devRouter = Router();

const devAuthController = container.get<DevAuthController>(TYPES.DevAuthController);

const devController = container.get<DevController>(TYPES.DevController);

const googleAuthController = container.get<GoogleAuthController>(TYPES.GoogleAuthController);

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
devRouter.post('/auth/logout', async (req, res) => {
  await devAuthController.logout(req, res);
})

devRouter
  .use(authMiddleware, autherization)
  .get('/profile', (req, res, next) => {
    devController.getProfile(req, res).catch(next);
  }).put('/profile',
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'resume', maxCount: 1 }
    ]),
    (req, res, next) => {
      devController.updateProfile(req, res).catch(next);
    }
  );

devRouter
  .use(authMiddleware, autherization)
  .post('/projects', upload.single('coverImage'), (req, res, next) => {
      devController.addProject(req, res).catch(next);
    })
  .get('/projects', (req, res) => {
    devController.getDeveloperProjects(req, res)
  });

devRouter
  .use(authMiddleware, autherization)
  .get('/projects/:projectId',
    (req, res) => {
      devController.getProject(req, res)
    }
  ).put('/projects/:projectId',
    upload.single('coverImage'),
    (req, res, next) => {
      devController.updateProject(req, res).catch(next);
    }
  ).delete('/projects/:projectId',
    (req, res) => {
      devController.deleteProject(req, res)
    }
  );

devRouter.get('/availability', authMiddleware, autherization, (req, res, next) => {
  devController.getUnavailableSlots(req, res).catch(next);
});

devRouter.post('/availability', authMiddleware, autherization, (req, res, next) => {
  devController.updateUnavailableSlots(req, res).catch(next);
});

devRouter.get('/default-availability', authMiddleware, autherization, (req, res, next) => {
  devController.getDefaultUnavailableSlots(req, res).catch(next);
});

devRouter.post('/default-availability', authMiddleware, autherization, (req, res, next) => {
  devController.updateDefaultUnavailableSlots(req, res).catch(next);
});

devRouter.get('/reviews', authMiddleware, autherization, (req, res, next) => {
  devController.getDeveloperReviews(req, res).catch(next);
});

devRouter.get('/dashboard/stats', authMiddleware, autherization, (req, res) => {
  devController.getDashboardStats(req, res);
});

devRouter.get('/dashboard/upcoming', authMiddleware, autherization, (req, res) => {
  devController.getUpcomingSessionsPreview(req, res);
});

export default devRouter; 