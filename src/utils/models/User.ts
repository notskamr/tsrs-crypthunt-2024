import { users, type SelectTeam, type SelectUser, questionResponses, validUsernames, type House } from "@/db/schema";
import { Team } from "./Team";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { Logger } from "./Logger";
import type { Question } from "./Question";

import type { DatabaseUserAttributes } from "lucia";

let VALID_USERNAMES: string[];

const setValidUsernames = async () => {
    VALID_USERNAMES = (await db.select().from(validUsernames)).map((u) => u.username);
};



export class User {
    readonly id: string | null;
    readonly username: string;
    private teamName: SelectTeam["name"];
    readonly role: SelectUser["role"];
    readonly team: Team | null;
    readonly initialized: boolean;
    static readonly logger = new Logger("User");
    static readonly responseLogger = new Logger("UserResponse");

    constructor(username: string, teamName: SelectTeam["name"]) {
        this.id = null;
        this.username = username;
        this.teamName = teamName;
        this.role = "player";
        this.team = null;
        this.initialized = false;
    }

    async create() {
        try {
            if (!VALID_USERNAMES) {
                setValidUsernames();
            }

            if (!VALID_USERNAMES?.includes(this.username.toLowerCase().replace("internal.tsrs.org", "").replace("tsrs.org", ""))) {
                throw new Error("Invalid username");
            }

            const team = await Team.fromName(this.teamName);
            if (!team) {
                throw new Error("Team not found");
            }
            (this.team as Team) = team;
            if (!team?.id) {
                throw new Error("Team not found");
            }

            // create user in db
            const user = (await db.insert(users).values({
                username: this.username,
                teamId: team.id!,
                role: this.role
            }).returning())[0];
            (this.id as string) = user.id;
            (this.initialized as boolean) = true;
            await User.logger.info(`New user created with id '${this.id}' and username '${this.username}'`, 1);
            return user;

        }
        catch {
            throw new Error("Team not found");
        }
    }

    static async createWithTeamId(username: string, teamId: number) {
        return (await db.insert(users).values({
            username,
            teamId,
            role: "player"
        }).returning())[0];
    }

    static async fromId(id: string) {
        const user = (await db.select().from(users).where(eq(users.id, id)))[0];
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.teamId) {
            throw new Error("No team found for user");
        }
        const team = await Team.fromId(user.teamId);
        if (!team) {
            throw new Error("Team not found");
        }
        const userO = new User(user.username, team.name);
        (userO.id as string) = user.id;
        (userO.initialized as boolean) = true;
        (userO.team as Team) = team;
        (userO.role as SelectUser["role"]) = user.role;
        return userO;
    }

    static async fromUsername(username: string) {
        const user = (await db.select().from(users).where(eq(users.username, username)))[0];
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.teamId) {
            throw new Error("No team found for user");
        }
        const team = await Team.fromId(user.teamId);
        if (!team) {
            throw new Error("Team not found");
        }
        const userO = new User(user.username, team.name);
        (userO.id as string) = user.id;
        (userO.initialized as boolean) = true;
        (userO.team as Team) = team;
        (userO.role as SelectUser["role"]) = user.role;
        return userO;
    }

    async updateRole(role: SelectUser["role"]) {
        this.checkInitialized();
        (this.role as SelectUser["role"]) = role;
        await User.logger.info(`User ${this.id} updated role to ${role}`);
        await db.update(users).set({ role }).where(eq(users.id, this.id!));
    }

    checkInitialized() {
        if (!this.initialized || !this.id) {
            throw new Error("User not initialized");
        }
    }

    async answerQuestion(answer: string) {
        this.checkInitialized();
        if (!this.team) {
            throw new Error("Team not found");
        }
        const response = await this.team.answerQuestion(answer, this.username);
        if (response.correct) {
            try {

                return true;
            }
            finally {
                await this.logAnswerResponse(answer, response.question, true);
            }
        }
        else {
            try {
                return false;
            }
            finally {
                await this.logAnswerResponse(answer, response.question, false);
            }
        }
    }

    async logAnswerResponse(answer: string, question: Question, correct: boolean) {
        this.checkInitialized();
        if (!this.id || !this.team) {
            throw new Error("User not initialized");
        }
        await db.insert(questionResponses).values({
            teamId: this.team!.id!,
            questionId: question!.id!,
            userId: this.id,
            response: answer,
            isCorrect: correct
        });
    }

    static async fromUserAttributes({ username, teamId, createdAt, role, id }: DatabaseUserAttributes & { id: string; }) {
        if (!teamId) {
            throw new Error("No team found for user");
        }
        const team = await Team.fromId(teamId);
        if (!team) {
            throw new Error("Team not found");
        }
        const user = new User(username, team.name);
        (user.id as string) = id;
        (user.role as SelectUser["role"]) = role;
        (user.initialized as boolean) = true;
        (user.team as Team) = team;
        return user;

    }
}