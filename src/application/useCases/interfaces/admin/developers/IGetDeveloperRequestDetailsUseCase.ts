import { IDeveloper } from "@/domain/entities/Developer";

export interface IGetDeveloperRequestDetailsUseCase{
    execute(developerId: string): Promise<IDeveloper>
}