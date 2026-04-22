import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isRegistering: { label: "Registering", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          let user = await prisma.user.findUnique({ where: { email: credentials.email } });
          
          if (!user) {
            // Only create user if they are explicitly registering
            if (credentials.isRegistering !== "true") {
              return null;
            }
            const count = await prisma.user.count();
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                hashedPassword,
                // First user ever gets ADMIN role automatically
                role: count === 0 ? "ADMIN" : "USER"
              }
            });
            return { id: user.id, email: user.email, name: user.name ?? null, role: user.role };
          }

          // Existing user — verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!isPasswordValid) return null;

          return { id: user.id, email: user.email, name: user.name ?? null, role: user.role };
        } catch (error) {
          console.error("[NextAuth] authorize error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
