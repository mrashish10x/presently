import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: string) {
return value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
trustHost: true,

providers: [
Google({
clientId: process.env.AUTH_GOOGLE_ID,
clientSecret: process.env.AUTH_GOOGLE_SECRET,
}),
Credentials({
id: "credentials",
name: "Email and Password",
credentials: {
email: { label: "Email", type: "email" },
password: { label: "Password", type: "password" },
role: { label: "Role", type: "text" },
},
async authorize(credentials) {
const email = normalizeEmail(String(credentials?.email ?? ""));
const password = String(credentials?.password ?? "");
const requestedRole = String(credentials?.role ?? "").trim().toUpperCase();

    if (!email || !password) return null;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || user.status !== "active") return null;

      const validRoles = ["ADMIN", "TEACHER", "STUDENT"];
      if (!validRoles.includes(user.role.toUpperCase())) return null;

      if (!requestedRole || requestedRole !== user.role.toUpperCase()) return null;

      const hash = user.passwordHash;
      // Only bcrypt hashes are accepted; plaintext password fallback is intentionally disabled.
      const passwordValid =
        typeof hash === "string" && /^\$2[aby]\$/.test(hash)
          ? await bcrypt.compare(password, hash)
          : false;

      if (!passwordValid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      };
    } catch (error) {
      console.error("AUTH ERROR:", error);
      return null;
    }
  },
}),

],

session: { strategy: "jwt" },
pages: { signIn: "/login/admin" },

callbacks: {
async signIn({ account, profile, user }) {
if (account?.provider === "credentials") return Boolean(user?.id && user?.role);
if (account?.provider !== "google") return false;

  const email = profile?.email?.trim().toLowerCase();
  if (!email || profile?.email_verified !== true) return false;

  const existing = await prisma.user.findFirst({
    where: { email: normalizeEmail(email), status: "active" },
    select: { id: true },
  });
  return Boolean(existing);
},

async jwt({ token, account, user }) {
  if (account?.provider === "credentials" && user) {
    const u = user as typeof user & { role?: string; schoolId?: string | null };
    token.userId = user.id;
    token.role = u.role;
    token.schoolId = u.schoolId ?? null;
  }

  if (account?.provider === "google" && token.email) {
    const existing = await prisma.user.findFirst({
      where: { email: normalizeEmail(token.email), status: "active" },
      select: { id: true, role: true, schoolId: true },
    });
    token.userId = existing?.id;
    token.role = existing?.role;
    token.schoolId = existing?.schoolId ?? null;
  }
  return token;
},

async session({ session, token }) {
  if (session.user && token.userId && token.role) {
    session.user.id = token.userId;
    session.user.role = String(token.role);
    session.user.schoolId = typeof token.schoolId === "string" ? token.schoolId : null;
  }
  return session;
},

},
});
