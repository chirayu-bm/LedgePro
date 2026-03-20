import { DefaultSession, DefaultUser } from "next-auth";
import type { AppRole } from "@/lib/contracts";

declare module "next-auth" {
  interface User extends DefaultUser {
    role: AppRole;
  }

  interface Session extends DefaultSession {
    user: {
      role: AppRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
  }
}