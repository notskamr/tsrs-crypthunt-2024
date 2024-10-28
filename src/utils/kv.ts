import { db } from "@/db";
import { dbkv } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

export const kv = {
    set(key: string, value: any) {
        const currentDate = new Date();
        return db.insert(dbkv).values({
            key,
            value
        }).onConflictDoUpdate({
            set: { value, updatedAt: currentDate },
            target: dbkv.key
        });
    },
    async get(key: string) {
        const res = await db.select().from(dbkv).where(eq(dbkv.key, key));
        return res[0] ? res[0].value : null;
    },
    async getMultiple(keys: string[]) {
        const res = await db.select().from(dbkv).where(or(...keys.map(key => eq(dbkv.key, key))));
        return res.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);
    },
    delete(key: string) {
        return db.delete(dbkv).where(eq(dbkv.key, key));
    }
};
