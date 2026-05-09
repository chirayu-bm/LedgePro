import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import AppleProvider from "next-auth/providers/apple";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { appRoleSchema, type AppRole } from "@/lib/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "demo-sme";

function toAppRole(role?: string): AppRole {
  const normalized = (role ?? "viewer").toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "accountant") return "accountant";
  return "viewer";
}

const providers: Provider[] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      tenantSlug: { label: "Workspace slug", type: "text" }
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim();
      const password = String(credentials?.password ?? "");
      const tenantSlug = String(credentials?.tenantSlug ?? DEFAULT_TENANT_SLUG).trim() || DEFAULT_TENANT_SLUG;

      if (!email || !password) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store"
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
      };

      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: toAppRole(data.user.role)
      };
    }
  })
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET
    })
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "ledgepro-dev-secret",
  providers,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user?.role) {
        token.role = toAppRole(user.role);
      } else if (!token.role) {
        token.role = "viewer";
      }
      return token;
    },

    session({ session, token }) {
      const parsedRole = appRoleSchema.safeParse(token.role);

      if (session.user) {
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }
        session.user.role = parsedRole.success ? parsedRole.data : "viewer";
      }
      return session;
    }
  }
});