import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from '@/infrastructure/db/database';
import authRouter from '@/presentation/routes/AuthRoutes';
import { morganOptions } from '@/utils/logger';
import adminRouter from './presentation/routes/AdminRoutes';
import devRouter from './presentation/routes/DevRoutes';

dotenv.config();

const app = express();

const morganFormat = ":method :url :status :response-time ms";

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials: true
};

app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());

app.use(morgan(morganFormat, morganOptions));

app.use('/auth', authRouter);
app.use('/admin', adminRouter)
app.use('/developer', devRouter)

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
