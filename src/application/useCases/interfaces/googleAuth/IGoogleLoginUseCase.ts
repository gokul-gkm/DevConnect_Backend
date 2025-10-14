import { IUser } from "@/domain/entities/User";

export interface IGoogleLoginResponse {
    user: IUser;
    accessToken: string;
    refreshToken: string;
}

export interface IGoogleLoginUseCase {
    execute(token: string): Promise<IGoogleLoginResponse>;
}
