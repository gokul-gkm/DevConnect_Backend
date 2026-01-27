
import type { StringValue } from "ms";
import { SignOptions } from 'jsonwebtoken'

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
export const JWT_ADMIN_ACCESS_SECRET = process.env.JWT_ADMIN_ACCESS_SECRET as string;
export const JWT_ADMIN_REFRESH_SECRET = process.env.JWT_ADMIN_REFRESH_SECRET as string;

export const ACCESS_EXPIRES_IN =
  process.env.ACCESS_EXPIRES_IN as StringValue;

export const REFRESH_EXPIRES_IN =
    process.env.REFRESH_EXPIRES_IN as StringValue;
  

export const accessSignOptions: SignOptions = {
    expiresIn: ACCESS_EXPIRES_IN,
};

export const refreshSignOptions: SignOptions = {
    expiresIn: REFRESH_EXPIRES_IN,
};
