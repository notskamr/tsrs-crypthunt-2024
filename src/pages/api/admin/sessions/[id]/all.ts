import { db } from "@/db";
import { sessions } from "@/db/schema";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";

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

        if ((userToDelete.role === "admin") && (userRole !== "admin")) {
            return new Response("Cannot delete all sessions of an admin as OC member", { status: 403 });
        }

        if (userToDelete.role === "oc" && userRole === "oc") {
            return new Response("OCs cannot delete all sessions of another OC", { status: 403 });
        }

        const deleteAll = await db.delete(sessions).where(eq(sessions.userId, id));
        return new Response(null, { status: 200 });
    }
    catch (error) {
        return new Response(null, { status: 500 });
    }
}