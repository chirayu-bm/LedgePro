import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { env } from "../config.js";
import { Role } from "@prisma/client";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header("authorization") ?? req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }

    const token = header.slice(7).trim();
    if (!token) return next();

    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown> | null;
    } catch (err) {
      // Invalid token: do not attach auth context
      return next();
    }

    const sub = typeof payload?.sub === "string" ? payload.sub : undefined;
    const tenantIdFromToken = typeof payload?.tenantId === "string" ? payload.tenantId : undefined;

    if (!sub) {
      return next();
    }

    // Fetch latest role/email from database to avoid stale or tampered tokens
    const user = await prisma.user.findUnique({ where: { id: sub }, select: { id: true, email: true, role: true, tenantId: true } });

    if (!user) return next();

    // Attach minimal auth context without overwriting tenant slug later
    req.ctx = {
      ...(req.ctx ?? {}),
      userId: user.id,
      userEmail: user.email,
      role: (user.role as Role) ?? (req.ctx?.role ?? Role.VIEWER),
      tenantId: tenantIdFromToken ?? user.tenantId ?? (req.ctx?.tenantId ?? "")
    } as any;

    return next();
  } catch (error) {
    // Never surface auth internals to clients
    // Log and continue without auth context
    // eslint-disable-next-line no-console
    console.error("authMiddleware error", error);
    return next();
  }
}
