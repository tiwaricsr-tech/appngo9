import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "bngsf_session";

const ADMIN_ROLES = [
  "SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER",
  "CAMPAIGN_MANAGER", "SOCIAL_MEDIA_MANAGER", "STORE_MANAGER",
];

async function getSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-in-production-please");
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  if (!isDashboard && !isAdmin) return NextResponse.next();

  const session = await getSession(req);
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);

  if (!session) {
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
