import { IUser } from "@/domain/entities/User";

export interface IGetUserDetailsUseCase{
    execute(userId: string): Promise<IUser | null>
}