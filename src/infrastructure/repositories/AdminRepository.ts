import { Admin, IAdmin } from "@/domain/entities/Admin";
import { AppError } from "@/domain/errors/AppError";
import { IAdminRepository } from "@/domain/interfaces/IAdminRepository";
import { StatusCodes } from "http-status-codes";


export class AdminRepository implements IAdminRepository {
   
    async findByEmail(email: string): Promise<IAdmin | null> {
        try {
            return await Admin.findOne({email});
        } catch (error) {
            console.error('Error fetching Admin by email:', error);
            throw new AppError('Failed to fetch admin', StatusCodes.INTERNAL_SERVER_ERROR);
        }  
        
    }

}