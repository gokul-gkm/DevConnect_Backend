import { AddProjectDTO } from "@/application/dto/developer/AddProjectDTO";

export interface IAddProjectUseCase{
    execute(developerId: string, data: AddProjectDTO): Promise<any>
}