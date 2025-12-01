
import { IDeveloperPopulated } from "@/infrastructure/repositories/DeveloperRepository";

export interface IGetDeveloperRequestDetailsUseCase{
    execute(developerId: string): Promise<IDeveloperPopulated | null>
}