import { Admin, IAdmin } from "@/domain/entities/Admin";
import { IAdminRepository } from "@/domain/interfaces/IAdminRepository";


export class AdminRepository implements IAdminRepository {
   
    async findByEmail(email: string): Promise<IAdmin | null> {
        return await Admin.findOne({email});
    }

}