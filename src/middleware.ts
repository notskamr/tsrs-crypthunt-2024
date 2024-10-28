// src/middleware.ts;
import { lucia } from "@/auth/lucia";
import { verifyRequestOrigin } from "lucia";
import { defineMiddleware, sequence } from "astro:middleware";
import { REQUEST_SIZE_LIMIT } from "./globals";
import type { APIContext } from "astro";
import { kv } from "./utils/kv";

export const OC_ROLES = ["oc", "admin"];

const OC_ROUTES = [
    "/api/admin",
    "/admin",
];

const IGNORED_ROUTES = [
    "/api/admin/login",
    "/admin/login",
    "/api/admin/toggle",
];

const RATE_LIMIT_ROUTES = [
    "/api/login",
    "/api/answer",
];

export async function auth(context: APIContext, next: () => Promise<Response>) {
    context.locals.ipCountry = context.request.headers.get("CF-IPCountry");

    if (Number(context.request.headers.get("content-length") || 0) > REQUEST_SIZE_LIMIT) {
        return new Response(null, {
            status: 413
        });
    }

    if (context.request.method !== "GET" && !import.meta.env.DEV) {
        const originHeader = context.request.headers.get("Origin");
        const hostHeader = context.request.headers.get("Host");
        if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
            return new Response(null, {
                status: 403
            });
        }
    }

    const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
        context.locals.user = null;
        context.locals.session = null;
        return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    if (session && session.ipAddress !== context.clientAddress) {
        // invalidate session
        await lucia.invalidateSession(sessionId);
        context.locals.user = null;
        context.locals.session = null;
        const sessionCookie = lucia.createBlankSessionCookie();
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        return new Response("Your IP address changed - please log in again", { status: 403 });
    }

    context.locals.session = session;
    context.locals.user = user;

    return next();
}

export async function admin(context: APIContext, next: () => Promise<Response>) {
    // dont allow non-admins to access admin routes
    const isOCRoute = OC_ROUTES.some((route) => context.url.pathname.startsWith(route));
    if (isOCRoute && context.locals.user?.role && (!OC_ROLES.includes(context.locals.user.role))) {
        return new Response(null, { status: 403 });
    }

    if (isOCRoute && (!IGNORED_ROUTES.includes(context.url.pathname))) {
        if (!context.locals.user) {
            return context.redirect("/admin/login", 302);
        }
        else {
            if (!(OC_ROLES.includes(context.locals.user.role))) {
                return new Response(null, { status: 403 });
            }
        }
    }
    return next();
}

export const onRequest = sequence(auth, admin);