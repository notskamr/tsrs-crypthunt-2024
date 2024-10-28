import { db } from "@/db";
import { users } from "@/db/schema";
import { createSelectSchema } from 'drizzle-zod';
import type { APIContext } from "astro";
import { and, asc, desc, eq, like } from "drizzle-orm";
import { z } from "zod";

const UserUpdateSchema = z.object({
    teamId: z.number().nullable(),
    role: z.enum(["player", "oc", "admin"]).optional(),
    username: z.string().optional(),
});

const UserCreateSchema = z.object({
    teamId: z.number().nullable(),
    role: z.enum(["player", "oc", "admin"]),
    username: z.string(),
});

export async function PUT({ params, request, locals: { user } }: APIContext) {
    const { id } = params;

    if (request.headers.get("content-type") !== "application/json") {
        return new Response("Invalid content type", { status: 400 });
    }

    if (!id) {
        return new Response(null, { status: 400 });
    }

    try {
        var body = await request.json();
    }
    catch (e) {
        // invalid json
        return new Response("Invalid JSON", { status: 400 });
    }


    const parsed = UserUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return new Response(null, { status: 400 });
    }

    const { username, teamId, role } = parsed.data;

    const userRole = user!.role;
    if (role === "admin" && userRole !== "admin") {
        return new Response("Only admins can update users to admin", { status: 403 });
    }

    try {
        const update = await db.update(users).set({ username, teamId, role }).where(eq(users.id, id));
        return new Response("Updated user", { status: 200 });
    }
    catch (error) {
        return new Response(null, { status: 500 });
    };
}

export async function POST({ request, locals: { user } }: APIContext) {
    if (request.headers.get("content-type") !== "application/json") {
        return new Response("Invalid content type", { status: 400 });
    }

    try {
        var body = await request.json();
    }
    catch (e) {
        // invalid json
        return new Response("Invalid JSON", { status: 400 });
    }

    const parsed = UserCreateSchema.safeParse(body);
    if (!parsed.success) {
        return new Response(null, { status: 400 });
    }

    const { teamId, role, username } = parsed.data;

    const userRole = user!.role;
    if (role === "admin" && userRole !== "admin") {
        return new Response("Only admins can create admin users", { status: 403 });
    }


    try {
        const insert = await db.insert(users).values({ teamId, role, username });
        return new Response("Created user", { status: 200 });
    }
    catch (error) {
        return new Response(null, { status: 500 });
    };
}


export async function DELETE({ params, locals: { user } }: APIContext) {
    const { id } = params;
    if (!id) {
        return new Response(null, { status: 400 });
    }
    try {
        const userToDelete = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.id, id),
        });

        if (!userToDelete) {
            return new Response("User not found", { status: 404 });
        }

        const userRole = user!.role;

        if (userToDelete.role === "admin" && userRole !== "admin") {
            return new Response("Only admins can delete other admins", { status: 403 });
        }

        if (userToDelete.role === "oc" && userRole === "oc") {
            return new Response("OCs cannot delete other OCs", { status: 403 });
        }

        const delete_ = await db.delete(users).where(eq(users.id, userToDelete.id));
        return new Response(null, { status: 200 });
    }
    catch (error) {
        return new Response(null, { status: 500 });
    }
}


type SelectUser = typeof users.$inferSelect;

const SelectUserSchema = createSelectSchema(users);

const UserGetSchema = z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    ...SelectUserSchema.shape
});


export async function GET({ url }: APIContext) {
    const query = url.searchParams;

    const parsed = UserGetSchema.safeParse(Object.fromEntries(query.entries()));
    if (!parsed.success) {
        return new Response(null, { status: 400 });
    }

    const { limit, offset, sort, order, ...select } = parsed.data;

    const sortMappings = {
        id: users.id,
        username: users.username,
        role: users.role,
        teamId: users.teamId,
        createdAt: users.createdAt,
    };

    if (sort && !(sort in sortMappings)) {
        return new Response(null, { status: 400 });
    }

    const sortThing = sort ? sortMappings[sort as keyof typeof sortMappings] : undefined;

    const orderBy = sortThing ? [order === "asc" ? asc(sortThing) : desc(sortThing)] : undefined;

    const users_ = await db.query.users.findMany({
        limit,
        offset,
        orderBy: orderBy,
        where: and(
            select.id ? eq(users.id, select.id) : undefined,
            select.username ? like(users.username, select.username) : undefined,
            select.role ? eq(users.role, select.role) : undefined,
            select.teamId ? eq(users.teamId, select.teamId) : undefined,
        )
    });

    return new Response(JSON.stringify(users_), { status: 200 });
}