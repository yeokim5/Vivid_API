import { Request } from "express";
import { IUser } from "./models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

export class ErrorWithStack extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorWithStack';
    Error.captureStackTrace(this, this.constructor);
  }
} 