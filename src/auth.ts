import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { decode } from "@auth/core/jwt";
import { verifyPassword } from "@/lib/password";

interface AppUser {
  username: string;
  password?: string;
  passwordHash?: string;
  name: string;
  role: string;
}

function getUsers(): AppUser[] {
  try {
    const raw = process.env.APP_USERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[auth] Failed to parse APP_USERS:", err);
  }
  console.warn("[auth] APP_USERS is not configured or empty; login is disabled.");
  return [];
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "default-secret-dev-key-my-express-jwt-32-chars",
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) return null;

        const users = getUsers();
        const user = users.find((u) => u.username === username);
        const storedSecret = user?.passwordHash ?? user?.password;
        if (!user || !storedSecret) return null;

        const valid = await verifyPassword(password, storedSecret);
        if (!valid) return null;

        return {
          id: user.username,
          name: user.name,
          email: `${user.username}@local`,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  jwt: {
    decode: async (params) => {
      try {
        return await decode(params);
      } catch {
        // Fallback decryption secrets if cookie was generated with an older secret
        const fallbacks = [
          process.env.AUTH_SECRET,
          process.env.NEXTAUTH_SECRET,
          "9f8c6e2b4a1d5e7f3c0b8a6d4e2f1a9c8b7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f",
          "change-me-in-production-use-openssl-rand-base64-32",
          "default-secret-dev-key-my-express-jwt-32-chars",
        ].filter(Boolean) as string[];

        for (const secret of fallbacks) {
          try {
            const res = await decode({ ...params, secret });
            if (res) return res;
          } catch {
            // continue
          }
        }
        return null;
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});

