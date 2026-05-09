import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../config.js";

export interface RequestContext {
  tenantId: string;
  tenantSlug: string;
  role: Role;
  userId?: string;
  userEmail?: string;
}

declare global {
  namespace Express {
    interface Request {
      ctx?: RequestContext;
    }
  }
}

function parseRole(value?: string): Role {
  if (!value) return Role.VIEWER;

  const normalized = value.trim().toUpperCase();
  if (normalized === Role.ADMIN) return Role.ADMIN;
  if (normalized === Role.ACCOUNTANT) return Role.ACCOUNTANT;
  return Role.VIEWER;
}

export async function withTenantContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = req.header("x-tenant-slug") ?? env.DEFAULT_TENANT_SLUG;
    const explicitTenantId = req.header("x-tenant-id");
    const requestedUserEmail = req.header("x-user-email")?.trim().toLowerCase();
    const requestedUserId = req.header("x-user-id") ?? undefined;

    const tenant = explicitTenantId
      ? await prisma.tenant.findUnique({ where: { id: explicitTenantId } })
      : await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
      res.status(404).json({ message: "Tenant not found" });
      return;
    }

    let resolvedRole = parseRole(req.header("x-user-role") ?? undefined);
    let resolvedUserId = requestedUserId;
    let resolvedUserEmail = requestedUserEmail;

    if (requestedUserEmail) {
      const membership = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: requestedUserEmail
          }
        },
        select: {
          id: true,
          role: true,
          email: true
        }
      });

      if (membership) {
        resolvedRole = membership.role;
        resolvedUserId = membership.id;
        resolvedUserEmail = membership.email;
      } else {
        // Never allow role escalation for unknown users in tenant scope.
        resolvedRole = Role.VIEWER;
        resolvedUserId = undefined;
      }
    }

    req.ctx = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: resolvedRole,
      userId: resolvedUserId,
      userEmail: resolvedUserEmail
    };

    next();
  } catch (error) {
    next(error);
  }
}
