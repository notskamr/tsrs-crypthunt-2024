import { db } from "@/db";
import { questions } from "@/db/schema";
import { Question } from "@/utils/models/Question";
import { JSONResponse } from "@/utils/responses";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateSchema = z.object({
    position: z.number().optional(),
    title: z.string().optional().nullable(),
    points: z.number().optional(),
    answer: z.string().optional(),
    type: z.enum(["online", "offline"]).optional(),
    content: z.string().optional()
});

const CreateSchema = z.object({
    position: z.number(),
    title: z.string().optional().nullable(),
    points: z.number(),
    answer: z.string(),
    type: z.enum(["online", "offline"]),
    content: z.string()
});

export async function PUT({ locals, request, params }: APIContext) {

    if (request.headers.get("content-type") !== "application/json") {
        return new Response("Invalid content type", { status: 400 });
    }

    const id = params.id;

    if (!id) {
        return new Response("Invalid id", { status: 400 });
    }


    try {
        var body = await request.json();
    }
    catch {
        return new Response("Invalid JSON", { status: 400 });
    }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
        return new Response("Invalid request - must have valid body", { status: 400 });
    }

    const { position, points, answer, type, content, title } = parsed.data;


    // update question
    await db.update(questions).set({ position, points, answer, type, content, title }).where(eq(questions.id, id)).then(async (update) => {
        await Question.logger.info(`Question ${id} updated - columns: '${update.columns.join(",")}'`);
    }).catch(async () => {
        await Question.logger.error(`Failed to update question ${id}`);
        return new Response("Failed to update question - error", { status: 500 });
    });

    await Question.normalizePositions(id);

    return new Response("PUT request received", { status: 200 });
}

export async function POST({ locals, request }: APIContext) {
    if (request.headers.get("content-type") !== "application/json") {
        return new Response("Invalid content type", { status: 400 });
    }

    try {
        var body = await request.json();
    }
    catch {
        return new Response("Invalid JSON", { status: 400 });
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
        return new Response("Invalid request - must have valid body", { status: 400 });
    }

    const { position, points, answer, type, content, title } = parsed.data;

    // create question
    try {
        const res = await db.insert(questions).values({
            position, points,
            answer: answer.split(";").map((a) => a.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim()).join(";")
            , type, content, title
        }).returning();
        await Question.logger.info(`Question created - ${content}`);
        return JSONResponse({ success: true, id: res[0].id });
    }
    catch (e) {
        console.error(e);
        await Question.logger.error(`Failed to create question`);
        return new Response("Failed to create question - error", { status: 500 });
    }

}

export async function DELETE({ locals, params }: APIContext) {
    const id = params.id;
    if (!id) {
        return new Response("Invalid id", { status: 400 });
    }

    await db.delete(questions).where(eq(questions.id, id)).then(async () => {
        await Question.logger.info(`Question '${id}' deleted`);
    }).catch(async () => {
        await Question.logger.error(`Failed to delete question '${id}'`);
        return new Response("Failed to delete question - error", { status: 500 });
    });

    return new Response("DELETE request received", { status: 200 });
}