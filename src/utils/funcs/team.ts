import { db } from "@/db";
import { teams, type SelectQuestion, type SelectTeam, type SelectUser } from "@/db/schema";
import { Logger } from "../models/Logger";
import { eq } from "drizzle-orm";

const TeamLogger = new Logger("Team");

export async function incrementQuestion(team: SelectTeam, currentQuestion: SelectQuestion, user?: SelectUser) {
    const nextQuestion = await db.query.questions.findFirst({
        where: (questions, { eq }) => eq(questions.position, currentQuestion.position + 1)
    });
    const currentDate = new Date();
    let res: SelectTeam | undefined;
    if (!nextQuestion) {
        res = (await db.update(teams).set({
            hasFinished: true,
            levelUpTime: currentDate,
            points: team.points + currentQuestion.points
        }).where(eq(teams.id, team.id)).returning())[0];
        await TeamLogger.info(`Team ${team.name} has finished!`);
        return;
    }
    res = (await db.update(teams).set({
        levelUpTime: currentDate,
        currentQuestionId: nextQuestion.id,
        points: team.points + currentQuestion.points
    }).where(eq(teams.id, team.id)).returning())[0];
    if (!res) {
        throw Error("Team not found");
    }
    await TeamLogger.info(`Team ${team.name} answered question id '${currentQuestion.id}' correctly - moved to question id '${nextQuestion.id}'`);
    return res;
}