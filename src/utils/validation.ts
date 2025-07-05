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