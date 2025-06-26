import { DevRequestDTO } from "@/application/dto/DevRequestDTO"

export interface IDevRequestUseCase{
    execute(
        data: DevRequestDTO,
        files: { 
            profilePicture?: Express.Multer.File[], 
            resume?: Express.Multer.File[] 
        }
    ): Promise<void>
}