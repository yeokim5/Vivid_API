import { Request } from "express";
import { IUser } from "../models/User";
import mongoose from "mongoose";

export interface ErrorWithStack extends Error {
  stack?: string;
}

export interface UserDocument {
  id: string;
  _id?: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
}

export interface AuthRequest extends Request {
  user?: UserDocument | IUser;
}
