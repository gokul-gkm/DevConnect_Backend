import { IAdmin } from "../entities/Admin";

export interface IAdminRepository { 
    findByEmail(email: string): Promise<IAdmin | null>
}