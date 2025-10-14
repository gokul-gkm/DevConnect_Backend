import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware";
import { TYPES } from "@/types/types";
import { container } from "@/infrastructure/config/inversify.config";

const adminRouter = Router();

const adminController = container.get<AdminController>(TYPES.AdminController);

adminRouter.post('/login', async (req, res) => {
    await adminController.login(req, res)
});

adminRouter.post('/logout', async (req, res) => {
    await adminController.logout(req, res)
});

adminRouter.get('/users', adminAuthMiddleware, async (req, res) => {
    await adminController.getUsers(req, res)
});

adminRouter.put('/users/status/:id', adminAuthMiddleware, async (req, res) => {
    await adminController.toggleUserStatus(req, res)
});

adminRouter.get('/users/:id', adminAuthMiddleware, async (req, res) => {
    await adminController.getUserDetails(req, res)
});

adminRouter.get('/developers', adminAuthMiddleware, async (req, res) => {
    await adminController.getAllDeveloper(req, res)
});

adminRouter.get('/developers/leaderboard', adminAuthMiddleware, async (req, res, next) => {
    adminController.getDeveloperLeaderboard(req, res).catch(next);
  });

adminRouter.get('/developer-requests', adminAuthMiddleware, async (req, res) => {
    await adminController.listRequests(req, res)
});

adminRouter.patch('/developers/:id/approve', adminAuthMiddleware, async (req, res) => {
    await adminController.approveRequest(req, res)
});

adminRouter.patch('/developers/:id/reject', adminAuthMiddleware, async (req, res) => {
    await adminController.rejectRequest(req, res)
});

adminRouter.get('/developers/:id', adminAuthMiddleware, async (req, res) => {
    await adminController.getDeveloperDetails(req, res)
});

adminRouter.get('/developer-requests/:id', adminAuthMiddleware, async (req, res) => {
    await adminController.getDeveloperRequestDetails(req, res)
});

adminRouter.get('/dashboard/stats', adminAuthMiddleware,
    async (req, res) => {
        await adminController.getDashboardStats(req, res)
    }
);

adminRouter.get('/revenue/stats', adminAuthMiddleware,
  async (req, res) => {
    await adminController.getRevenueStats(req, res)
  }
);

adminRouter.get('/sessions', adminAuthMiddleware,
  async (req, res) => {
    await adminController.getAdminSessions(req, res)
  }
);

export default adminRouter;