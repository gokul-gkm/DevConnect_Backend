import { AddProjectDTO } from "@/application/dto/developer/AddProjectDTO";
import { AddProjectResult } from "@/application/useCases/implements/developer/profile/AddProjectUseCase";

export interface IAddProjectUseCase{
    execute(developerId: string, data: AddProjectDTO): Promise<AddProjectResult>
}