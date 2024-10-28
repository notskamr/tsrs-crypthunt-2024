import { cryptoRand } from "@/utils/funcs";
import { User } from "@/utils/models/User";
import { JSONResponse } from "@/utils/responses";
import { z } from "zod";
import type { APIContext } from "astro";
import { answerQuestion } from "@/utils/funcs/user";
import { kv } from "@/utils/kv";
import { db } from "@/db";
import { questionResponses } from "@/db/schema";


const AnswerRequestSchema = z.object({
    questionId: z.string(),
    answer: z.string().min(1).max(50),
    responseId: z.string().uuid().optional(),
});

type AnswerRequest = z.infer<typeof AnswerRequestSchema>;

export async function POST({ request, clientAddress, locals: { user: user_, session }, redirect }: APIContext) {
    const start = Date.now();
    if (request.headers.get("content-type") !== "application/json") {
        return JSONResponse({ error: "Invalid content-type" }, { status: 400 });
    }
    if (!user_ || !session) {
        // redirect to /login
        return redirect("/login", 302);
    }
    try {
        var body = await request.json();
    }
    catch {
        return JSONResponse({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = AnswerRequestSchema.safeParse(body);
    if (!parsed.success) {
        return JSONResponse({ error: "Invalid request - must have valid answer" }, { status: 400 });
    }
    const { answer, responseId, questionId } = parsed.data;

    const paused = await kv.get("ch:paused") === "1";
    if (paused) {
        return JSONResponse({ error: "Game is paused" }, { status: 400 });
    }
    try {
        var res = await answerQuestion(answer, user_.id, questionId, { responseId });
    }
    catch (e: any) {
        console.error(e);
        return JSONResponse({ error: e.message }, { status: 400 });
    }

    console.log(`Response took ${(Date.now() - start) / 1000}s`);
    return JSONResponse(res);
}