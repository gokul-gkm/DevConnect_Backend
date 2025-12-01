import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { z } from 'zod';
const profileUpdateSchema = z.object({
    username: z.string()
        .min(2, 'Username must be at least 2 characters')
        .max(30, 'Username must not exceed 30 characters'),
    contact: z.string()
        .optional()
        .transform((val) => val ? Number(val) : undefined), 
    location: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()),
    socialLinks: z.object({
        github: z.string().url().optional()
            .transform(val => val || null),   
        linkedIn: z.string().url().optional()
            .transform(val => val || null),
        twitter: z.string().url().optional()
            .transform(val => val || null),
        portfolio: z.string().url().optional()
            .transform(val => val || null)
    })
});

export const validateProfileUpdate = (data: unknown) => {
    return profileUpdateSchema.parse(data);
};

const createSessionSchema = z.object({
    title: z.string()
        .trim()
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title must not exceed 100 characters'),
    description: z.string()
        .trim()
        .min(20, 'Description must be at least 20 characters')
        .max(500, 'Description must not exceed 500 characters'),
    topics: z.array(z.string().trim().min(1, 'Topic cannot be empty'))
        .min(1, 'Select at least one topic')
        .max(5, 'Maximum 5 topics allowed'),
    sessionDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
    startTime: z.union([z.string(), z.date()]).transform(val => new Date(val)),
    duration: z.number()
        .int('Duration must be an integer')
        .min(30, 'Minimum duration is 30 minutes')
        .max(120, 'Maximum duration is 120 minutes')
        .refine((val) => val % 30 === 0, {
            message: 'Duration must be in 30-minute increments'
        }),
    price: z.number()
        .nonnegative('Price cannot be negative'),
    developerId: z.string()
        .min(1, 'Developer ID is required')
        .refine((val) => Types.ObjectId.isValid(val), {
            message: 'Invalid developer ID format'
        }),
    userId: z.string()
        .min(1, 'User ID is required')
        .refine((val) => Types.ObjectId.isValid(val), {
            message: 'Invalid user ID format'
        })
}).refine((data) => {
    const now = new Date();
    return data.startTime > now;
}, {
    message: 'Session start time must be in the future',
    path: ['startTime']
}).refine((data) => {

    const sessionDateISO = data.sessionDate.toISOString().slice(0, 10);
    const startTimeISO = data.startTime.toISOString().slice(0, 10); 
    return sessionDateISO === startTimeISO;
}, {
    message: 'Session date and start time must be on the same day',
    path: ['startTime']
});

export const validateCreateSession = (data: unknown) => {
    try {
        return createSessionSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            throw new AppError(
                firstError.message,
                StatusCodes.BAD_REQUEST
            );
        }
        throw error;
    }
};