import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

interface AppUser {
  username: string;
  password: string;
  name: string;
  role: string;
}

const DEFAULT_USERS: AppUser[] = [
  {
    username: "admin",
    password: "admin1234",
    name: "Administrator",
    role: "admin",
  },
  {
    username: "user1",
    password: "user1234",
    name: "ผู้ใช้งาน",
    role: "user",
  },
];

function getUsers(): AppUser[] {
  try {
    const raw = process.env.APP_USERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_USERS;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "default-secret-dev-key-express-thongthan-32-chars",
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const users = getUsers();
        const user = users.find(
          (u) =>
            u.username === credentials?.username &&
            u.password === credentials?.password
        );
        if (!user) return null;
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

