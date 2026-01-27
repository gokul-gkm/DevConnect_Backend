import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";


export function getParamAsString(
  param: string | string[] | undefined,
  paramName: string
): string {
  if (!param) {
    throw new AppError(
      `Missing route parameter: ${paramName}`,
      StatusCodes.BAD_REQUEST
    );
  }

  if (Array.isArray(param)) {
    throw new AppError(
      `Invalid route parameter: ${paramName}`,
      StatusCodes.BAD_REQUEST
    );
  }

  return param;
}
