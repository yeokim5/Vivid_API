import { Request } from "express";

export interface ErrorWithStack extends Error {
  stack?: string;
}

export interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: UserDocument;
}
