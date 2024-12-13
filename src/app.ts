import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from '@/infrastructure/db/database';
import authRouter from '@/presentation/routes/AuthRoutes';

dotenv.config();

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true
};

app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser())
app.use(morgan('dev'));

app.use('/auth', authRouter)

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
