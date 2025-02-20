import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middleware/authMiddleware";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { upload } from "@/utils/multer";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";

const userRouter = Router()

const userRepository = new UserRepository();
const developerRepository = new DeveloperRepository();
const s3Service = new S3Service()

const userController = new UserController(userRepository,developerRepository, s3Service);

userRouter.get('/profile', authMiddleware, (req, res, next) => {
    userController.getProfile(req, res).catch(next);
});

userRouter.put('/profile/update', 
    authMiddleware, 
    upload.single('profilePicture'),
    (req, res, next) => {
        userController.updateProfile(req, res).catch(next);
    }
);

userRouter.get('/developers/search', (req, res) => {
    userController.searchDevelopers(req, res)
})

userRouter.get('/dev-profile/:developerId', (req, res) => {
    userController.getPublicProfile(req, res)
})

export default userRouter