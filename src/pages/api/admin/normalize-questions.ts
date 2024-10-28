import { Question } from "@/utils/models/Question";
import type { APIContext } from "astro";

export async function POST({ request }: APIContext) {
    await Question.normalizePositions();
    return new Response("Normalized", { status: 200 });
}