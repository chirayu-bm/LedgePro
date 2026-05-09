import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.ctx?.role;

    if (!role || !allowed.includes(role)) {
      res.status(403).json({ message: "Forbidden: insufficient role" });
      return;
    }

    next();
  };
}
