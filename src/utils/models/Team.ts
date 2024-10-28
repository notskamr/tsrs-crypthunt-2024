import { db } from "@/db";
import { teams, type SelectQuestion, type House } from "@/db/schema";
import { Question } from "./Question";
import { eq } from "drizzle-orm";
import { GlobalLogger, Logger } from "./Logger";
import { genPassword } from "..";
import { Scrypt } from "lucia";

import EventEmitter from 'events';
import { hashPassword, verifyPassword } from "../auth";
import { FLUX_ID } from "@/globals";

interface AnswerQuestionResponse {
    correct: boolean;
    question: Question;
    nextQuestion: Question | null;
}

// change name to not House type but string later (shriteq)
export class Team {
    readonly id: number | null;
    readonly name: House;
    readonly points: number;
    readonly isHouse: boolean;
    readonly currentQuestionId: string | null;
    readonly levelUpTime: Date | null;
    readonly hasFinished: boolean;
    readonly initialized: boolean;
    static readonly logger = new Logger("Team");

    constructor(name: House, points: number, isHouse: boolean, levelUpTime: Date | null = null, currentQuestionId: string | null = null) {
        this.id = null;
        this.name = name;
        this.points = points;
        this.isHouse = isHouse;
        this.currentQuestionId = currentQuestionId;
        this.levelUpTime = levelUpTime;
        this.initialized = false;
        this.hasFinished = false;
    }

    async create({ consoleLog = true } = {}) {
        if (this.initialized) {
            throw new Error("Team already instantiated");
        }
        // get consoleLog from options

        try {
            // generate password which is 3 random words joined by '-'

            const password = await genPassword(3);
            const hashedPassword = await hashPassword(password);

            const result = await db.insert(teams).values({
                name: this.name,
                points: this.points,
                isHouse: this.isHouse,
                currentQuestionId: '-1',
                hashedPassword
            }).returning();
            (this.id as number | null) = result[0].id;
            (this.initialized as boolean) = true;
            (this.currentQuestionId as string) = result[0].currentQuestionId;
            (this.levelUpTime as Date | null) = result[0].levelUpTime;
            if (consoleLog)
                console.log("Team created with id", this.id);
            await Team.logger.info(`New team created with id '${this.id}' and name '${this.name}'`);
            // return the full team object with password
            const { hashedPassword: _, ...team } = result[0];
            return { ...team, password };
        } catch (e: any) {
            if (e.code === "SQLITE_CONSTRAINT" && e?.message?.includes("UNIQUE constraint failed")) {
                throw new Error("Team name already exists");
            }
            throw new Error("Team creation failed");
        }
    }

    async checkPassword(password: string) {
        if (!this.id) {
            throw new Error("Team not created yet");
        }
        const team = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, this.id!)
        });
        if (!team) {
            throw new Error("Team not found");
        }
        return await verifyPassword(team.hashedPassword, password);
    }

    static async fromId(id: number) {
        const team = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, id)
        });
        if (!team) {
            throw new Error("Team not found");
        }
        const tO = new Team(team.name, team.points, team.isHouse, team.levelUpTime, team.currentQuestionId);
        (tO.id as number | null) = team.id;
        (tO.initialized as boolean) = true;
        return tO;
    }

    static async fromName(name: House) {
        const team = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.name, name)
        });
        if (!team) {
            return null;
        }
        const tO = new Team(team.name, team.points, team.isHouse, team.levelUpTime, team.currentQuestionId);
        (tO.id as number | null) = team.id;
        (tO.initialized as boolean) = true;
        return tO;
    }

    async getCurrentQuestion() {
        await this.sync();
        if (!this.id) {
            throw new Error("Team not created yet");
        }
        if (!this.currentQuestionId) {
            throw new Error("Team has no current question");
        }

        if (this.hasFinished) {
            throw new Error("Team has finished");
        }

        return Question.fromId(this.currentQuestionId);
    }

    async answerQuestion(answer: string, username?: string) {
        await this.sync();
        const question = await this.getCurrentQuestion();
        await Team.logger.info(`New response from team ${this.name} to question id '${question.id}' - answer '${answer}'`, 3);
        if (question.checkAnswer(answer)) {
            const res = await this.incrementQuestion();
            try {

                const sseSend = await fetch(`https://flux.vsahni.me/flux/${FLUX_ID}`, {
                    headers: {
                        'Authorization': 'Bearer ' + process.env.SSE_AUTH_TOKEN,
                    },
                    method: 'POST',
                    body: JSON.stringify({ teamId: this.id, teamName: this.name, username }),
                });
                if (!sseSend.ok || !(await sseSend.json()).sent) {
                    console.error("Error sending SSE request", sseSend.status, await sseSend.text());
                    await GlobalLogger.error(`Error sending SSE request for team ${this.name}`);
                }
            }
            catch (e) {
                console.error("Error sending SSE request", e);
                await GlobalLogger.error(`Error sending SSE request for team ${this.name}`);
            }
            return { correct: true, ...res };
        }
        return { correct: false, question };
    }

    async setPoints(points: number) {
        if (!this.id) {
            throw new Error("Team not created yet");
        }
        await db.update(teams).set({
            points
        }).where(eq(teams.id, this.id));
        (this.points as number) = points;
    }

    private async incrementQuestion() {
        if (!this.id) {
            throw new Error("Team not created yet");
        }
        if (this.hasFinished) {
            throw new Error("Team has already finished");
        }

        const team = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, this.id!)
        });
        if (!team) {
            throw new Error("Team not found - error");
        }

        const currentQuestion = await this.getCurrentQuestion();
        let nextQuestion: Question | null = null;
        try {
            nextQuestion = await Question.fromPosition(currentQuestion.position + 1);
        }
        catch (e) {
        }
        if (!nextQuestion) {
            const levelUpTime = new Date();
            (this.hasFinished as boolean) = true;
            (this.levelUpTime as Date) = levelUpTime;
            try {
                await db.update(teams).set({
                    hasFinished: true,
                    levelUpTime: levelUpTime,
                }).where(eq(teams.id, this.id));
                await Team.logger.info(`Team ${this.name} finished`);
            }
            catch (e) {
                console.error(e);
                throw new Error("Error updating team - question incremet");
            }
            return { question: currentQuestion, nextQuestion: null };
        }
        try {
            const levelUpTime = new Date();
            await db.update(teams).set({
                currentQuestionId: nextQuestion.id!,
                levelUpTime,
                points: team.points + currentQuestion.points
            }).where(eq(teams.id, this.id));
            (this.currentQuestionId as string) = nextQuestion.id!;
            (this.levelUpTime as Date) = levelUpTime;
            (this.points as number) = team.points + currentQuestion.points;
            await Team.logger.info(`Team ${this.name} answered question id '${currentQuestion.id}' correctly - moved to question id '${nextQuestion.id}'`);
            return { question: currentQuestion, nextQuestion };
        } catch (e) {
            console.error(e);
            throw new Error("Error updating team - question incremet");
        }
    }

    async setPassword(password: string) {
        if (!this.id) {
            throw new Error("Team not created yet");
        }
        const hashedPassword = await new Scrypt().hash(password);
        await db.update(teams).set({
            hashedPassword
        }).where(eq(teams.id, this.id));
    }

    static async allByPointsDescending() {
        return await db.query.teams.findMany({
            orderBy: (teams, { asc, desc }) => [desc(teams.points), asc(teams.levelUpTime), asc(teams.name)],
        });
    }

    static async allByPointsAscending() {
        return await db.query.teams.findMany({
            orderBy: (teams, { asc }) => [asc(teams.points), asc(teams.name)],
        });
    }

    static async top3Comparatively() {
        const res = await this.allByPointsDescending();
        if (res.length === 0) {
            return [];
        }
        const topPoints = res[0].points;
        return res.map((team) => {
            return {
                ...team,
                progress: (team.points / topPoints)
            };
        });
    }

    static async allAsClassInstances() {
        // return all teams as class instances
        const teams = await db.query.teams.findMany();
        return teams.map((team) => {
            const tO = new Team(team.name, team.points, team.isHouse, team.levelUpTime, team.currentQuestionId);
            (tO.id as number | null) = team.id;
            (tO.initialized as boolean) = true;
            return tO;
        });
    }

    static async clear() {
        await Team.logger.info("All teams cleared");
        return await db.delete(teams).returning();
    }

    async sync() {
        if (!this.id) {
            throw new Error("Team not created yet");
        }
        const team = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, this.id!)
        });
        if (!team) {
            throw new Error("Team not found - error");
        }
        (this.points as number) = team.points;
        (this.currentQuestionId as string | null) = team.currentQuestionId;
        (this.levelUpTime as Date | null) = team.levelUpTime;
        (this.hasFinished as boolean) = team.hasFinished;
    }
}