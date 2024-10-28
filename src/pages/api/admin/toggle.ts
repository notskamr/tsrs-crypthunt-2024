import { verifyPassword } from "@/utils/auth";
import { kv } from "@/utils/kv";
import { GlobalLogger } from "@/utils/models/Logger";
import type { APIContext } from "astro";
import { z } from "zod";


const ToggleSchema = z.object({
    paused: z.boolean().nullable().optional(),
    started: z.boolean().nullable().optional(),
});

export async function POST({ request, locals }: APIContext) {
    if (request.headers.get("content-type") !== "application/json") {
        return new Response("Invalid content type", { status: 400 });
    }

    const { user } = locals;
    const authHeader = request.headers.get("Authorization");
    const bearer = authHeader?.split(" ");
    let authType: "bearer" | "cookie" = "cookie";
    // check if admin or bearer token
    const adminTokenHashed = await kv.get("admin:token");
    if (bearer && bearer[0] === "Bearer" && adminTokenHashed && (await verifyPassword(adminTokenHashed, bearer[1] || ""))) {
        authType = "bearer";
    } else if (user?.role === "admin") {
        authType = "cookie";
    } else {
        return new Response(null, { status: 401 });
    }

    try {
        var body = await request.json();
    }
    catch {
        return new Response("Invalid JSON", { status: 400 });
    }

    const parsed = ToggleSchema.safeParse(body);
    if (!parsed.success) {
        return new Response(null, { status: 400 });
    }
    const { paused, started } = parsed.data;
    console.log(paused, started);

    if (paused !== undefined) {
        await kv.set("ch:paused", paused ? "1" : "0");
    }
    if (started !== undefined) {
        await kv.set("ch:started", started ? "1" : "0");
    }

    await GlobalLogger.log(`Game state changed: paused=${paused}, started=${started} - '${authType === "cookie" ? user!.username : "bearer"}'`);
    return new Response(JSON.stringify({
        paused: paused,
        started: started
    }), { status: 200, headers: { "Content-Type": "application/json" } });
}