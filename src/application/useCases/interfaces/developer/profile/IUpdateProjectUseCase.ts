import { UpdateProjectDTO } from "@/application/useCases/implements/developer/profile/UpdateProjectUseCase";
import { IProject } from "@/domain/entities/Project";

export type UpdateProjectResult = IProject & { coverImageUrl?: string };

export interface IUpdateProjectUseCase{
    execute(data: UpdateProjectDTO):  Promise<UpdateProjectResult>
}