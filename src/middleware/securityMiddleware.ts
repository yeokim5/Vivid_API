import { Request, Response, NextFunction } from 'express';

export const setSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set Content Security Policy headers
  res.setHeader("Content-Security-Policy", 
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://youtube.com https://vivid-eight.vercel.app; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vivid-eight.vercel.app; " +
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://vivid-eight.vercel.app; " +
    "img-src 'self' data: blob: https: https://assets.lummi.ai https://images.stockcake.com https://*.stockcake.com https://vivid-eight.vercel.app; " +
    "connect-src 'self' https://api.unsplash.com https://assets.lummi.ai https://fonts.googleapis.com https://fonts.gstatic.com https://www.youtube.com https://youtube.com https://vivid-eight.vercel.app; " +
    "font-src 'self' data: https: https://fonts.gstatic.com https://vivid-eight.vercel.app; " +
    "object-src 'none'; " +
    "media-src 'self' https://www.youtube.com https://youtube.com; " +
    "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com; " +
    "worker-src 'self' blob:;"
  );

  // Set other security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  next();
}; 