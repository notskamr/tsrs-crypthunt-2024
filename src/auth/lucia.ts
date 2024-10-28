import { db } from "@/db";
import { sessions, users, type SelectUser, type SelectSession } from "@/db/schema";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: import.meta.env.PROD,
        },
    },
    getUserAttributes: (attributes) => ({
        username: attributes.username,
        teamId: attributes.teamId,
        role: attributes.role,
        createdAt: attributes.createdAt,
    }),
    getSessionAttributes: (attributes) => ({
        ipAddress: attributes.ipAddress,
        ipCountry: attributes.ipCountry,
    }),
});

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
        DatabaseSessionAttributes: DatabaseSessionAttributes;
    }
    export type DatabaseUserAttributes = Omit<SelectUser, "id">;
    export interface DatabaseSessionAttributes {
        ipAddress: string;
        ipCountry: string | null;
    }
}