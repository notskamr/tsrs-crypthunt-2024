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
        const delete_ = await db.delete(sessions).where(eq(sessions.id, id));
        return new Response(null, { status: 200 });
    }
    catch (error) {
        return new Response(null, { status: 500 });
    }
}