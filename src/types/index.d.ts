import { Request } from "express";

export interface ErrorWithStack extends Error {
  stack?: string;
}

export interface AuthRequest extends Request {
  user?: any;
}

// Type declarations for nlp_chunk.js
declare module "../../nlp_chunk.js" {
  export function processText(
    text: string,
    numSections?: number
  ): Record<string, string>;
  export function splitIntoSentences(text: string): string[];
  export function divideTextIntoSections(
    sentences: string[],
    numSections: number
  ): string[][];
}

// Type declarations for background_image.js
declare module "../../background_image.js" {
  interface BackgroundImageInput {
    title: string;
    sections: Record<string, string>;
  }

  export default function generateBackgroundImages(
    inputData?: BackgroundImageInput
  ): Promise<string | Record<string, string>>;
}
