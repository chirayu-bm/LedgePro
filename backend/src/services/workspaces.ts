import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { ensureDefaultGoalsForTenant, ensureSystemAccountsForTenant } from "./bootstrap.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSlugBase(value: string): string {
  // Build slug character by character to avoid regex ReDoS vulnerabilities
  // Only keep alphanumeric chars, replace sequences of non-alphanumeric with single dash
  const chars: string[] = [];
  const normalized = value.trim().toLowerCase();
  let lastWasDash = false;

  for (const char of normalized) {
    if ((char >= "a" && char <= "z") || (char >= "0" && char <= "9")) {
      chars.push(char);
      lastWasDash = false;
    } else if (!lastWasDash && chars.length > 0) {
      chars.push("-");
      lastWasDash = true;
    }
  }

  // Remove leading/trailing dashes by trimming and limiting length
  let result = chars.join("");
  // Strip leading dashes
  while (result.length > 0 && result[0] === "-") {
    result = result.slice(1);
  }
  // Strip trailing dashes
  while (result.length > 0 && result[result.length - 1] === "-") {
    result = result.slice(0, -1);
  }
  return result.slice(0, 40);
}

async function makeUniqueTenantSlug(baseInput: string): Promise<string> {
  const base = toSlugBase(baseInput) || "workspace";
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const existing = await prisma.tenant.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`.slice(0, 48);
  }
}

function toRole(role: string): Role {
  const normalized = role.trim().toUpperCase();
  if (normalized === Role.ADMIN) return Role.ADMIN;
  if (normalized === Role.ACCOUNTANT) return Role.ACCOUNTANT;
  return Role.VIEWER;
}

function toAppRole(role: Role): "admin" | "accountant" | "viewer" {
  if (role === Role.ADMIN) return "admin";
  if (role === Role.ACCOUNTANT) return "accountant";
  return "viewer";
}

export type WorkspaceSummaryDTO = {
  tenantId: string;
  slug: string;
  name: string;
  baseCurrency: string;
  role: "admin" | "accountant" | "viewer";
};

export type WorkspaceMemberDTO = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "accountant" | "viewer";
  createdAt: string;
};

export async function listWorkspacesForEmail(rawEmail: string): Promise<WorkspaceSummaryDTO[]> {
  const email = normalizeEmail(rawEmail);

  const memberships = await prisma.user.findMany({
    where: { email },
    select: {
      role: true,
      tenant: {
        select: {
          id: true,
          slug: true,
          name: true,
          baseCurrency: true
        }
      }
    }
  });

  return memberships
    .map((membership) => ({
    tenantId: membership.tenant.id,
    slug: membership.tenant.slug,
    name: membership.tenant.name,
    baseCurrency: membership.tenant.baseCurrency,
    role: toAppRole(membership.role)
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function createWorkspaceForUser(input: {
  creatorEmail: string;
  currentTenantId?: string;
  name: string;
  slug?: string;
  baseCurrency?: string;
}): Promise<WorkspaceSummaryDTO> {
  const creatorEmail = normalizeEmail(input.creatorEmail);
  if (!creatorEmail) {
    throw new Error("Creator email is required");
  }

  const existingMembership = input.currentTenantId
    ? await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: input.currentTenantId,
            email: creatorEmail
          }
        }
      })
    : null;

  const fallbackIdentity = await prisma.user.findFirst({
    where: { email: creatorEmail },
    orderBy: { createdAt: "asc" }
  });

  const identity = existingMembership ?? fallbackIdentity;
  if (!identity) {
    throw new Error("Unable to find creator identity in existing workspace membership");
  }

  const workspaceName = input.name.trim();
  if (workspaceName.length < 2) {
    throw new Error("Workspace name must be at least 2 characters");
  }

  const requestedSlug = (input.slug ?? "").trim();
  const slug = await makeUniqueTenantSlug(requestedSlug || workspaceName);
  const baseCurrency = (input.baseCurrency ?? "USD").trim().toUpperCase().slice(0, 3) || "USD";

  const tenant = await prisma.tenant.create({
    data: {
      name: workspaceName,
      slug,
      baseCurrency
    }
  });

  await ensureSystemAccountsForTenant(tenant.id);
  await ensureDefaultGoalsForTenant(tenant.id);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: creatorEmail,
      name: identity.name,
      role: Role.ADMIN,
      passwordHash: identity.passwordHash
    }
  });

  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    baseCurrency: tenant.baseCurrency,
    role: "admin"
  };
}

export async function listWorkspaceMembers(tenantId: string): Promise<WorkspaceMemberDTO[]> {
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: toAppRole(user.role),
    createdAt: user.createdAt.toISOString()
  }));
}

export async function inviteWorkspaceMember(input: {
  tenantId: string;
  email: string;
  name: string;
  role: string;
  password?: string;
}): Promise<WorkspaceMemberDTO> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("Invite email is required");
  }

  const role = toRole(input.role);
  const normalizedName = input.name.trim();
  if (normalizedName.length < 2) {
    throw new Error("Invitee name must be at least 2 characters");
  }

  const existingMembership = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: input.tenantId,
        email
      }
    }
  });

  const knownIdentity = await prisma.user.findFirst({
    where: { email },
    orderBy: { createdAt: "asc" }
  });

  const explicitPassword = (input.password ?? "").trim();
  if (!explicitPassword && !existingMembership?.passwordHash && !knownIdentity?.passwordHash) {
    throw new Error("Password is required when inviting a new user");
  }

  const nextPasswordHash = explicitPassword
    ? await bcrypt.hash(explicitPassword, 12)
    : existingMembership?.passwordHash ??
      knownIdentity?.passwordHash;

  if (!nextPasswordHash) {
    throw new Error("Unable to resolve password hash for invitee");
  }

  const user = existingMembership
    ? await prisma.user.update({
        where: {
          tenantId_email: {
            tenantId: input.tenantId,
            email
          }
        },
        data: {
          name: normalizedName,
          role,
          ...(explicitPassword ? { passwordHash: nextPasswordHash } : {})
        }
      })
    : await prisma.user.create({
        data: {
          tenantId: input.tenantId,
          email,
          name: normalizedName,
          role,
          passwordHash: nextPasswordHash
        }
      });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toAppRole(user.role),
    createdAt: user.createdAt.toISOString()
  };
}
