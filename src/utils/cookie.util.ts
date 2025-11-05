import { Response } from "express";
const ACCESS_COOKIE_MAX_AGE = Number(process.env.ACCESS_COOKIE_MAX_AGE);
const REFRESH_COOKIE_MAX_AGE = Number(process.env.REFRESH_COOKIE_MAX_AGE);

export const setCookie = (res: Response, name: string, value: string): void => {
  let maxAge: number;
  switch (name) {
    case "accessToken":
    case "adminAccessToken":
      maxAge = ACCESS_COOKIE_MAX_AGE;
      break;
    case "refreshToken":
    case "adminRefreshToken":
      maxAge = REFRESH_COOKIE_MAX_AGE;
      break;
    default:
      maxAge = 24 * 60 * 60 * 1000;
  }

  res.cookie(name, value, {
    httpOnly: true,
    secure: true,    
    sameSite: "none",
    path: "/",
    maxAge,
  });
};
