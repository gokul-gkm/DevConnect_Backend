import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "@/utils/multer";
import { autherization } from "../middleware/autherization";
import { container } from "@/infrastructure/config/inversify.config";
import { TYPES } from "@/types/types";

const userRouter = Router()

const userController = container.get<UserController>(TYPES.UserController);

userRouter.get('/developers/search', (req, res) => {
    userController.searchDevelopers(req, res)
})

userRouter.get('/dev-profile/:developerId', (req, res) => {
    userController.getPublicProfile(req, res)
});

userRouter
    .use(authMiddleware, autherization)
    .get('/profile', (req, res, next) => {
        userController.getProfile(req, res).catch(next);
    })
    .put('/profile', upload.single('profilePicture'), (req, res, next) => {
        userController.updateProfile(req, res).catch(next);
    });

userRouter.put('/change-password', authMiddleware, autherization, (req, res, next) => {
    userController.changePassword(req, res).catch(next)
})


export default userRouter