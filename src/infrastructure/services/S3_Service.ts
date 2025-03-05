
import { AppError } from '@/domain/errors/AppError';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';

dotenv.config();

export class S3Service {
    private S3Client: S3Client;
    private bucket: string;

    constructor() {
        this.S3Client = new S3Client({
            region: process.env.S3_BUCKET_REGION,
            credentials: {
                accessKeyId: process.env.S3_BUCKET_ACCESS_KEY!,
                secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY!,
            },
        });
      
        this.bucket = process.env.S3_BUCKET_NAME!;
    }

    async uploadFile(file: Express.Multer.File, folder: string = '') {
        const key = `${folder}/${Date.now()}-${file.originalname}`;

        const params = {
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const command = new PutObjectCommand(params);
        await this.S3Client.send(command);

        return { Key: key };
    }

    async deleteFile(fileKey: string) {
        const params = {
            Bucket: this.bucket,
            Key: fileKey,
        };
        const command = new DeleteObjectCommand(params);
        await this.S3Client.send(command);
    }

    async generateSignedUrl(key: string): Promise<string> {
        try {
            const expiresIn = Number(process.env.S3_SIGNED_URL_EXPIRY) || 3600;
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            return await getSignedUrl(this.S3Client, command, { expiresIn });
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new AppError('Error generating signed URL', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}

