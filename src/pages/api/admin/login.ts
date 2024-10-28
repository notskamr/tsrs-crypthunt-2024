import { lucia } from "@/auth/lucia";
import { db } from "@/db";
import { users, type SelectUser } from "@/db/schema";
import { OC_ROLES } from "@/middleware";
import { getSessionAndCookie, hashPassword, verifyPassword } from "@/utils/auth";
import { checkValidUsername, getUser } from "@/utils/funcs/user";
import { kv } from "@/utils/kv";
import { User } from "@/utils/models/User";
import { JSONResponse } from "@/utils/responses";

import type { APIContext, AstroCookies } from "astro";
import { z } from "zod";

const LoginRequestSchema = z.object({
    username: z.string().min(1).max(50).toLowerCase(),
    password: z.string().min(1).max(50),
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;

export async function POST({ request, cookies, clientAddress, locals: { session: session_, user: user_, ipCountry } }: APIContext): Promise<Response> {
    if (user_ || session_) {
        return JSONResponse({ error: "Already logged in" }, { status: 400 });
    }

    if (request.headers.get("content-type") !== "application/json") {
        return JSONResponse({ error: "Invalid content type" }, { status: 400 });
    }

    try {
        var body = await request.json();
    }
    catch {
        return JSONResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
        return JSONResponse({ error: "Invalid request - must have valid username and password" }, { status: 400 });
    }

    const { username, password } = parsed.data;

    // get user: create new user if not exists, only if password is correct
    let user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
    });

    if (!user) {
        return JSONResponse({ error: "Invalid user" }, { status: 401 });
    }

    // check if user is admin
    if (user && !(OC_ROLES.includes(user.role))) {
        return JSONResponse({ error: "Invalid user" }, { status: 403 });
    }

    // let created = false;
    const adminPasswordHash = await kv.get("admin:password");
    if (!await verifyPassword(adminPasswordHash!, password)) {
        return JSONResponse({ error: "Invalid password" }, { status: 401 });
    }

    // at this point, password is correct but user may not exist -- Commented out because we are not creating new admin users
    // if (!user) {
    //     // check if username is valid
    //     if (!(await checkValidUsername(username))) {
    //         return JSONResponse({ error: "Invalid username" }, { status: 401 });
    //     }
    //     user = await db.insert(users).values({
    //         username,
    //         role: "admin",
    //     }).returning().then((res) => res[0]);
    //     if (!user) {
    //         return JSONResponse({ error: "Failed to create user" }, { status: 500 });
    //     }
    //     created = true;
    // }

    const { session, sessionCookie } = await getSessionAndCookie(user?.id, clientAddress, ipCountry);
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    await User.logger.info(`'${user.role}' logged in with username '${username}'`, 1);
    return JSONResponse({ success: true }, { status: 200 });
}