import "reflect-metadata";
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from '@/infrastructure/db/database';
import authRouter from '@/presentation/routes/AuthRoutes';
import { morganOptions } from '@/utils/logger';
import adminRouter from './presentation/routes/AdminRoutes';
import devRouter from './presentation/routes/DevRoutes';
import userRouter from '@/presentation/routes/UserRoutes'
import { createSessionRouter } from '@/presentation/routes/SessionRoutes';
import { errorHandler } from './utils/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { paymentRouter } from './presentation/routes/PaymentRoutes';
import { createChatRouter } from './presentation/routes/ChatRoutes';
import { createServer } from 'http';
import { SocketService } from './infrastructure/services/SocketService';
import { Server as SocketServer } from 'socket.io';
import { createNotificationRouter } from './presentation/routes/NotificationRoutes';
import { createVideoSessionRouter } from './presentation/routes/videoSessionRoutes';

dotenv.config();

export const app = express();
export const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true, 
    pingTimeout: 60000,
    pingInterval: 25000
});

SocketService.getInstance(httpServer, io);

const morganFormat = ":method :url :status :response-time ms";

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
};

const notificationRouter = createNotificationRouter();
const sessionRouter = createSessionRouter();

app.use('/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(morgan(morganFormat, morganOptions));

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/developer', devRouter);
app.use('/users', userRouter);
app.use('/sessions', sessionRouter);
app.use('/payments', paymentRouter);
app.use('/notifications', notificationRouter);
app.use('/chats', createChatRouter(httpServer));
app.use('/video-sessions', createVideoSessionRouter());

app.use((req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Route not found',
      code: 'NOT_FOUND'
    });
});
  
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});