import { UpdateProjectDTO } from "@/application/useCases/implements/developer/profile/UpdateProjectUseCase";

export interface IUpdateProjectUseCase{
    execute(data: UpdateProjectDTO): Promise<{ [key: string]: any }> 
}