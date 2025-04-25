import { Router } from 'express';
import express from 'express'
import { PaymentController } from '../controllers/PaymentController';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { PaymentRepository } from '@/infrastructure/repositories/PaymentRepository';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { autherization } from '../middleware/autherization';


const router = Router();

const sessionRepository = new SessionRepository();
const walletRepository = new WalletRepository();
const paymentRepository = new PaymentRepository();

const paymentController = new PaymentController(
  sessionRepository,
  walletRepository,
  paymentRepository
);

router.post( '/sessions/:sessionId/payment', authMiddleware, autherization, 
  paymentController.createPaymentSession.bind(paymentController)
);

router.post( '/webhook', express.raw({ type: 'application/json' }),
  paymentController.handleWebhook.bind(paymentController)
);

router.post( '/sessions/:sessionId/transfer', adminAuthMiddleware,
  paymentController.transferToDevWallet.bind(paymentController)
);

router.get( '/admin/wallet', adminAuthMiddleware, 
  paymentController.getAdminWalletDetails.bind(paymentController)
);

router.get('/wallet', authMiddleware, autherization,
  paymentController.getWalletDetails.bind(paymentController)
);

export const paymentRouter = router;