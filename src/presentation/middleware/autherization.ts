
import { Request, Response, NextFunction,  } from "express";
import { User } from "@/domain/entities/User";
import { StatusCodes } from "http-status-codes";
import { AppError } from "@/domain/errors/AppError";

export const autherization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (currentUser?.status == "active") next();
    else {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Your account has been blocked by admin" });
    }
  } catch (error) {
    console.log("Error in Autherization");
  }
};
