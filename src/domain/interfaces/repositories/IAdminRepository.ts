import { IAdmin } from "../../entities/Admin";
import { IBaseRepository } from "./IBaseRepository";

export interface IAdminRepository extends IBaseRepository<IAdmin> { 
    findByEmail(email: string): Promise<IAdmin | null>
}