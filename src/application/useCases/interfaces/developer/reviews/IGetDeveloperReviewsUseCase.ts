export interface IGetDeveloperReviewsUseCase{
    execute(
    developerId: string, 
    page :number, 
    limit : number, 
    search:string, 
    sortOrder : string
  ) :Promise<any>
}