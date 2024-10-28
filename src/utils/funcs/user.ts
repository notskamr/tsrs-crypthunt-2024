import { db } from "@/db";
import { incrementQuestion } from "./team";
import { GlobalLogger } from "../models/Logger";
import { questionResponses, users, validUsernames } from "@/db/schema";
import { FLUX_ID } from "@/globals";

let VALID_USERNAMES: string[];

const setValidUsernames = async () => {
    VALID_USERNAMES = (await db.select().from(validUsernames)).map((u) => u.username);
};

export async function createUser(username: string, teamId?: number) {
    if (!VALID_USERNAMES) {
        await setValidUsernames();
    }
    if (!(await checkValidUsername(username))) {
        throw Error("Invalid username");
    }
    await db.insert(users).values({
        teamId,
        username
    });
}

export async function getUser(username: string) {
    return await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
        with: {
            team: {
                with: {
                    currentQuestion: true
                }
            }
        }
    });
}

export function getBearerToken() {
    return `Bearer ${import.meta.env.SSE_AUTH_TOKEN}`;
}

export async function answerQuestion(answer: string, userId: string, clientQuestionId: string, ssePaylod?: any) {
    const data = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        with: {
            team: {
                with: {
                    currentQuestion: true
                }
            }
        }
    });

    if (!(data?.team)) {
        throw Error("Player does not belong to a team");
    }
    const { team } = data;

    if (team.bannedUntil && team.bannedUntil > new Date()) {
        throw Error("Team is banned");
    }

    const { currentQuestion } = team;
    const answers = currentQuestion.answer.split(";");

    if (clientQuestionId !== currentQuestion.id) {
        throw Error("Question ID mismatch - client out of sync with server");
    }

    // replace all non-alphanumeric characters and convert to lowercase
    answer = answer.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    // check if answer is correct
    const correct: boolean = answers.includes(answer);

    if (correct) {
        const res = await incrementQuestion(team, currentQuestion, data).catch((e) => {
            throw Error("Error incrementing question");
        }).then(async (res) => {
            await db.insert(questionResponses).values({
                teamId: team.id,
                isCorrect: correct,
                questionId: currentQuestion.id,
                response: answer,
                userId: data!.id
            });
            return res;
        });

        try {
            const sseSend = await fetch(`https://flux.vsahni.me/flux/${FLUX_ID}`, {
                headers: {
                    'Authorization': getBearerToken(),
                },
                method: 'POST',
                body: JSON.stringify({ teamId: team.id, points: res?.points ?? null, teamName: team.name, username: data.username, ...ssePaylod }),
            });

            const t = await sseSend.text();

            if (!sseSend.ok || t !== `{"success":true}`) {
                console.error(sseSend.statusText, t);
                throw Error("SSE request failed");
            }
            else {
                console.log("SSE request sent");
            }
            return { correct, currentQuestionId: res?.currentQuestionId ?? null, answer };
        } catch (e) {
            console.log(e);
            await GlobalLogger.error(`Error sending SSE request for team '${team.name}'`);
            throw Error("Error sending SSE request");
        }
    }
    await db.insert(questionResponses).values({
        teamId: team.id,
        isCorrect: correct,
        questionId: currentQuestion.id,
        response: answer,
        userId: data!.id
    });
    return { correct, currentQuestionId: team.currentQuestionId, answer };
}

export async function checkValidUsername(username: string) {
    if (!VALID_USERNAMES) {
        await setValidUsernames();
    }
    return VALID_USERNAMES.includes(username);
}