import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL as string);
        console.log("MongoDB connected Successfully");
    } catch (error) {
        console.error('MongoDB connection Failed: ', error);
    }
}

export default connectDB;