import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    businessName?: string | null;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    businessName?: string | null;
    rememberMe?: boolean;
  }
}
