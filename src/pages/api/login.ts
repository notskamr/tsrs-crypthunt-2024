import { lucia } from "@/auth/lucia";
import { db } from "@/db";
import { users, type SelectUser } from "@/db/schema";
import { getSessionAndCookie, hashPassword, verifyPassword } from "@/utils/auth";
import { checkValidUsername } from "@/utils/funcs/user";
import { Logger } from "@/utils/models/Logger";
import { JSONResponse } from "@/utils/responses";

import type { APIContext, AstroCookies } from "astro";
import { z } from "zod";

const LoginRequestSchema = z.object({
    teamId: z.number().int().positive(),
    username: z.string().min(1).max(50).toLowerCase(),
    password: z.string().min(1).max(50),
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;

const logger = new Logger("LoginAttempt");


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
        return JSONResponse({ error: "Invalid request - must have valid teamId, username, and password" }, { status: 400 });
    }

    const { teamId, username: username_, password } = parsed.data;

    const username = username_.toLowerCase().replace("@internal.tsrs.org", "").replace("@tsrs.org", "");

    const hiddenPassword = password.slice(0, 5) + "*".repeat(password.length - 5);
    logger.info(`Login attempt - teamId: ${teamId}, username: ${username}, input: ${hiddenPassword}`);

    let created = false;
    // First, check if user exists with given team id and username
    let userData = await db.query.users.findFirst({
        where: (users, { and, eq }) => eq(users.username, username),
        with: {
            team: true
        }
    });

    if (userData) {
        created = false;
        if (userData.role !== "player") {
            return JSONResponse({ error: "Use non-player login" }, { status: 403 });
        }
    }

    if (userData && userData.teamId !== teamId) {
        return JSONResponse({ error: "Stop trying to log into a different team!" }, { status: 401 });
    }
    if (!userData) {
        // user doesnt exist - must be created
        if (!(await checkValidUsername(username))) {
            return JSONResponse({ error: "Invalid username" }, { status: 401 });
        }
        // user doesnt exist, check if team exists
        const team = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, teamId)
        });
        if (!team) {
            return JSONResponse({ error: "Invalid team" }, { status: 401 });
        }

        if (!await verifyPassword(team.hashedPassword, password)) {
            return JSONResponse({ error: "Invalid password" }, { status: 401 });
        }
        // team exists, create user
        await db.insert(users).values({
            teamId: teamId,
            username: username,
        });
        userData = await db.query.users.findFirst({
            where: (users, { and, eq }) => eq(users.username, username),
            with: {
                team: true
            }
        });
        created = true;
    }
    else {
        // user exists, check password
        if (!userData.team) {
            return JSONResponse({ error: "No team" }, { status: 401 });
        }
        if (!await verifyPassword(userData.team.hashedPassword, password)) {
            return JSONResponse({ error: "Invalid password" }, { status: 401 });
        }
    }

    // user exists and password is correct
    const user = userData as SelectUser;

    const { session, sessionCookie } = await getSessionAndCookie(user?.id, clientAddress, ipCountry);
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return JSONResponse({ success: true, created }, { status: 200 });
};


