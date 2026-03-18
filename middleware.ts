import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      if (req.nextUrl.pathname.startsWith("/api/auth")) {
        return true;
      }

      if (req.nextUrl.pathname.startsWith("/api/public")) {
        return true;
      }

      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/proposals/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
