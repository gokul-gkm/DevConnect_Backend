import { ProfileUpdateData } from "@/domain/types/developer"

export interface IUpdateDeveloperProfileUseCase{
    execute(
            userId: string, 
            profileData: ProfileUpdateData, 
            files: { 
                profilePicture?: Express.Multer.File[],
                resume?: Express.Multer.File[]
            }
        ):Promise<any>
}