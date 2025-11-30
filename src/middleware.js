// middleware.js

import { NextResponse } from "next/server";

export function middleware(req) {
    // Get user cookie
    const user = req.cookies.get("userPhone")?.value;
    const pathname = req.nextUrl.pathname;


    console.log("🔍 Middleware - Pathname:", pathname, "User:", user ? "YES" : "NO");

    // Public routes (no auth needed)
    const publicRoutes = ["/login"];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Protected routes (auth needed)
    const protectedRoutes = ["/dashboard"];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If trying to access login page and already logged in
    if (isPublicRoute && user) {
        console.log("✅ Already logged in - redirecting to /dashboard");
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If trying to access protected route without login
    if (isProtectedRoute && !user) {
        console.log("❌ Not logged in - redirecting to /login");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If accessing root "/" redirect based on login status
    if (pathname === "/") {
        if (user) {
            console.log("✅ Logged in at / - redirecting to /dashboard");
            return NextResponse.redirect(new URL("/dashboard", req.url));
        } else {
            console.log("❌ Not logged in at / - redirecting to /login");
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    // Allow all other requests
    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/dashboard/:path*"],
};
