import { Team } from "@/utils/models/Team";
import { JSONResponse } from "@/utils/responses";
import type { APIContext } from "astro";

export async function GET({ url }: APIContext) {
    // get querystring
    const comparative = url.searchParams.get("comparative") === "true";
    if (!comparative) {
        const teams = await Team.allByPointsDescending();

        const teamsMapped = teams.map((team) => {
            return {
                name: team.name,
                points: team.points
            };
        });

        return JSONResponse(teamsMapped, { status: 200 });
    }
    else {
        const teams = await Team.top3Comparatively();
        const teamsMapped = teams.map((team) => {
            return {
                name: team.name,
                points: team.points,
                progress: Math.min(1, Math.max(0.2, team.progress))
            };
        });
        return JSONResponse(teamsMapped, { status: 200 });
    }
}