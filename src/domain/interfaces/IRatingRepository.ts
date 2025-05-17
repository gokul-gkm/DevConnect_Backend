import { Types } from "mongoose";
import { IRating } from "../entities/Rating";

export interface IRatingRepository{
    createRating(rating: {
        userId: Types.ObjectId;
        sessionId: Types.ObjectId;
        developerId: Types.ObjectId;
        rating: number;
        comment?: string;
    }): Promise<IRating>
    getRatingBySessionId(sessionId: string): Promise<IRating | null>
    updateRating(
        ratingId: string, 
        data: { rating: number; comment?: string }
    ): Promise<IRating | null>
    deleteRating(ratingId: string): Promise<boolean>
    getAverageRatingByDeveloperId(developerId: string): Promise<number>
    getDeveloperReviews(
        developerId: string, 
        page?: number, 
        limit?: number, 
        search?: string,
        sortOrder?: string
    ): Promise<{
        reviews: any[];
        pagination: { totalPages: number; currentPage: number; totalItems: number };
    }>
}