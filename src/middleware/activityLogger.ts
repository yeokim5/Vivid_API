import { Request, Response, NextFunction } from "express";
import Activity from "../models/Activity";
import { AuthRequest } from "../types";

interface ActivityLogData {
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Helper function to log activities
export const logActivity = async (
  userId: string,
  action: string,
  details: any = {},
  req?: Request
): Promise<void> => {
  try {
    const activityData = {
      userId,
      action,
      details,
      ipAddress:
        req?.ip ||
        req?.headers["x-forwarded-for"] ||
        req?.connection?.remoteAddress,
      userAgent: req?.get("User-Agent"),
    };

    await Activity.create(activityData);
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error to avoid breaking main functionality
  }
};

// Middleware to automatically log certain activities
export const activityLogger = (
  action: string,
  getDetails?: (req: Request, res: Response) => any
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to log after successful response
    res.json = function (body: any) {
      // Check if request was successful (status < 400)
      if (res.statusCode < 400 && req.user) {
        const userId = req.user.id || req.user._id;
        const details = getDetails ? getDetails(req, res) : { body: req.body };

        // Log activity asynchronously
        setImmediate(() => {
          logActivity(userId, action, details, req);
        });
      }

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

// Specific activity loggers for common actions
export const logUserLogin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    const userId = req.user.id || req.user._id;
    setImmediate(() => {
      logActivity(
        userId,
        "user_login",
        {
          loginMethod: req.body.loginMethod || "unknown",
        },
        req
      );
    });
  }
  next();
};

export const logEssayCreation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    if (res.statusCode === 201 && req.user && body.success) {
      const userId = req.user.id || req.user._id;
      setImmediate(() => {
        logActivity(
          userId,
          "essay_created",
          {
            essayId: body.essayId,
            title: req.body.title,
            isPrivate: req.body.isPrivate || false,
          },
          req
        );
      });
    }
    return originalJson.call(this, body);
  };

  next();
};

export const logEssayView = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function (body: any) {
    if (res.statusCode === 200) {
      // Skip logging essay views for now since they don't have authenticated users
      // TODO: Implement anonymous view tracking with IP-based identification
    }
    return originalSend.call(this, body);
  };

  next();
};

export const logCreditUsage = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    if (res.statusCode === 200 && req.user && body.success) {
      const userId = req.user.id || req.user._id;
      setImmediate(() => {
        logActivity(
          userId,
          "credit_used",
          {
            creditsRemaining: body.credits,
          },
          req
        );
      });
    }
    return originalJson.call(this, body);
  };

  next();
};

export const logCreditPurchase = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    if (res.statusCode === 200 && req.user && body.success) {
      const userId = req.user.id || req.user._id;
      setImmediate(() => {
        logActivity(
          userId,
          "credit_purchased",
          {
            creditsAdded: req.body.credits,
            amount: req.body.amount,
            totalCredits: body.credits,
          },
          req
        );
      });
    }
    return originalJson.call(this, body);
  };

  next();
};
