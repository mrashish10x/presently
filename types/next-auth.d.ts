import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    schoolId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      schoolId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    schoolId?: string | null;
  }
}

export {};
