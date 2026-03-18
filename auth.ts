import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
            role: "admin",
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
            role: "viewer",
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
        token.role = user.role; // ✅ no "any"
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string; // safe
      }
      return session;
    }
  }
});