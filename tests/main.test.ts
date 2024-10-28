
import { expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { answerQuestion } from "@/utils/funcs/user";

test("spam responses", async () => {
    const team = await db.select().from(teams).limit(1).where(eq(teams.name, "sagar"));
    const user = await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.teamId, team[0].id),
        with: {
            team: {
                with: {
                    currentQuestion: true
                }
            }
        }
    });
    console.log(user);
    if (!user || !team[0]) {
        return;
    }

    for (let i = 0; i < 500; i++) {
        const user = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.teamId, team[0].id),
            with: {
                team: {
                    with: {
                        currentQuestion: true
                    }
                }
            }
        });

        const response = await answerQuestion(
            user!.team?.currentQuestion?.answer!
            , user!.id, user?.team?.currentQuestionId!);
        console.log(response);
    }
});