import { ProfileUpdateData } from "@/domain/types/types";

export interface IUpdateUserProfileUseCase{
    execute(userId: string, profileData: ProfileUpdateData, files: { profilePicture?: Express.Multer.File[] }):Promise<any>
}