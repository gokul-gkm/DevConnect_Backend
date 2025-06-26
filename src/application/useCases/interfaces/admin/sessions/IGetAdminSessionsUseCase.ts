export interface IGetAdminSessionsUseCase{
    execute(status: string[], page: number, limit: number, search: string): Promise<any>
}