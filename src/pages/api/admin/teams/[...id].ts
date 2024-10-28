import { db } from "@/db";
import { teams } from "@/db/schema";
import type { House } from "@/db/schema";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { z } from "zod";



const TeamUpdateSchema = z.object({
    name: z.enum(["sagar", "vasundhara", "srishti", "himgiri", "alumni"]).optional(),
    points: z.number().gte(0).optional(),
    levelUpTime: z.coerce.date().nullable().optional(),
    bannedUntil: z.coerce.date().nullable().optional(),
    hasFinished: z.boolean().optional(),
    currentQuestionId: z.string().optional(),
});

export async function PUT({ params, request }: APIContext) {
    let { id: rawId } = params;

    const id = Math.floor(Number(rawId));
    if (!id) {
        return new Response(null, { status: 400 });
    }

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
    const parsed = TeamUpdateSchema.safeParse(body);
    if (!(parsed.success)) {
        return new Response(null, { status: 400 });
    }

    const { name, points, levelUpTime, bannedUntil, hasFinished, currentQuestionId } = parsed.data;
    const updateData = { points, levelUpTime, bannedUntil, hasFinished, currentQuestionId, ...(!!name ? { name } : {}) };

    try {
        const update = await db.update(teams).set(updateData).where(eq(teams.id, id));
        return new Response("Updated team", { status: 200 });
    }
    catch (error: any) {
        return new Response(error?.message, { status: 500 });
    };
}