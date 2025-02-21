import express, { Request, Response, NextFunction } from 'express';
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
import sessionRouter from '@/presentation/routes/SessionRoutes';
import { errorHandler } from './utils/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { paymentRouter } from './presentation/routes/PaymentRoutes';

dotenv.config();

const app = express();

const morganFormat = ":method :url :status :response-time ms";

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials: true
};

app.use('/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());

app.use(morgan(morganFormat, morganOptions));

app.use('/auth', authRouter);
app.use('/admin', adminRouter)
app.use('/developer', devRouter)
app.use('/users', userRouter)
app.use('/sessions', sessionRouter)
app.use('/payments', paymentRouter);

app.use((req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Route not found',
      code: 'NOT_FOUND'
    });
});
  
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
