import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { appRoleSchema, type AppRole } from "@/lib/contracts";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (
          credentials?.email === "admin@ledgerflow.io" &&
          credentials?.password === "admin"
        ) {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@ledgerflow.io",
            role: "admin" as AppRole,
          };
        }

        if (
          credentials?.email === "viewer@ledgerflow.io" &&
          credentials?.password === "viewer"
        ) {
          return {
            id: "2",
            name: "Viewer",
            email: "viewer@ledgerflow.io",
            role: "viewer" as AppRole,
          };
        }

        return null;
      }
    })
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    session({ session, token }) {
      const parsedRole = appRoleSchema.safeParse(token.role);

      if (session.user && parsedRole.success) {
        session.user.role = parsedRole.data;
      }
      return session;
    }
  }
});