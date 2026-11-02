import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Request } from "express";
import User from "../models/User";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "super_secret_corewatch_key_2026"
      );

      // Get user from the token, excluding password
      const userId = decoded.id || decoded.userId || decoded._id;

      if (userId) {
        req.user = await User.findById(userId).select("-password");
      }

      // If not found in User, check if userId is a Customer ID or linked to a User
      if (!req.user && userId) {
        try {
          const Customer = require("../models/Customer").default;
          const cust = await Customer.findById(userId);
          if (cust?.user) {
            req.user = await User.findById(cust.user).select("-password");
          }
          if (!req.user && cust) {
            req.user = cust;
          }
        } catch (e) {}
      }

      // Fallback: check x-user-email header or decoded.email
      const candidateEmail = (req.headers["x-user-email"] as string) || decoded.email;
      if (!req.user && candidateEmail) {
        const cleanEmail = candidateEmail.toLowerCase().trim();
        req.user = await User.findOne({ email: cleanEmail }).select("-password");
        if (!req.user) {
          try {
            const Customer = require("../models/Customer").default;
            req.user = await Customer.findOne({ email: cleanEmail }).select("-password");
          } catch (e) {}
        }
      }

      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authorized, user not found" });
        return;
      }

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({
        success: false,
        message: `Not authorized, token failed: ${error instanceof Error ? error.message : String(error)}`
      });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized, no token" });
    return;
  }
};

/**
 * Optional authentication: Populates req.user if Bearer token is provided,
 * but does not reject request if token is absent (useful for internal service calls passing verified userId in payload).
 */
export const optionalProtect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "super_secret_corewatch_key_2026"
      );
      const userId = decoded.id || decoded.userId || decoded._id;

      if (userId) {
        req.user = await User.findById(userId).select("-password");
      }

      if (!req.user && userId) {
        try {
          const Customer = require("../models/Customer").default;
          const cust = await Customer.findById(userId);
          if (cust?.user) {
            req.user = await User.findById(cust.user).select("-password");
          }
          if (!req.user && cust) {
            req.user = cust;
          }
        } catch (e) {}
      }

      const candidateEmail = (req.headers["x-user-email"] as string) || decoded.email;
      if (!req.user && candidateEmail) {
        const cleanEmail = candidateEmail.toLowerCase().trim();
        req.user = await User.findOne({ email: cleanEmail }).select("-password");
      }
    } catch (error) {
      // Token expired or invalid, continue without req.user
    }
  }

  next();
};

export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied, admin role required" });
  }
};
