import { Router } from 'express';
import express from 'express'
import { PaymentController } from '../controllers/PaymentController';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { autherization } from '../middleware/autherization';
import { container } from '@/infrastructure/config/inversify.config';
import { TYPES } from '@/types/types';

const router = Router();

const paymentController = container.get<PaymentController>(TYPES.PaymentController);

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