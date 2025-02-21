import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { AdminRepository } from "@/infrastructure/repositories/AdminRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { WalletRepository } from "@/infrastructure/repositories/WalletRepository";



const adminRouter = Router();
const adminRepository = new AdminRepository();
const userRepository = new UserRepository();
const developerRepository = new DeveloperRepository()
const walletRepository = new WalletRepository()
const s3Service = new S3Service()
const adminController = new AdminController(adminRepository, userRepository, developerRepository,s3Service, walletRepository);



adminRouter.post('/login', async(req, res) => {
    await adminController.login(req, res)
});

adminRouter.post('/logout', async (req, res) => {
    await adminController.logout(req, res)
});

adminRouter.get('/users',adminAuthMiddleware, async (req, res) => {
    await adminController.getUsers(req, res)
});

adminRouter.put('/users/status/:id', async (req, res) => {
    await adminController.toggleUserStatus(req, res)
 });

adminRouter.get('/users/:id', async (req, res) => {
    await adminController.getUserDetails(req, res)
})

adminRouter.get('/developers', async (req, res) => {
    await adminController.getAllDeveloper(req, res)
})

adminRouter.get(
    '/developer-requests', async (req, res) => { await adminController.listRequests(req, res) }
);

adminRouter.patch(
    '/developers/:id/approve',
    async(req, res) => { await adminController.approveRequest(req, res)}
);

adminRouter.patch(
    '/developers/:id/reject',
    async(req, res) => {await adminController.rejectRequest(req, res)}
);

adminRouter.get('/developers/:id', async (req, res) => {
    await adminController.getDeveloperDetails(req, res)
})

adminRouter.get(
    '/developer-requests/:id',
    async (req, res) => {
        await adminController.getDeveloperRequestDetails(req, res)
    }
);

export default adminRouter;