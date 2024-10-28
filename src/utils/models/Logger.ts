import { db } from "@/db";
import { logs } from "@/db/schema";

export class Logger {
    private _namespace?: string;
    constructor(namespace?: string) {
        this._namespace = namespace;
    }

    get namespace() {
        return this._namespace;
    }

    set namespace(namespace: string | undefined) {
        this._namespace = namespace;
    }

    async log(message: string, priority?: number) {
        await db.insert(logs).values({
            message,
            namespace: this._namespace,
            level: "log",
            priority: priority ?? 0
        });
    }

    async error(message: string, priority?: number) {
        await db.insert(logs).values({
            message,
            namespace: this._namespace,
            level: "error",
            priority: priority ?? 0
        });
    }

    async warn(message: string, priority?: number) {
        await db.insert(logs).values({
            message,
            namespace: this._namespace,
            level: "warn",
            priority: priority ?? 0
        });
    }

    async debug(message: string, priority?: number) {
        await db.insert(logs).values({
            message,
            namespace: this._namespace,
            level: "debug",
            priority: priority ?? 0
        });
    }

    async info(message: string, priority?: number) {
        await db.insert(logs).values({
            message,
            namespace: this._namespace,
            level: "info",
            priority: priority ?? 0
        });
    }
}

export const GlobalLogger = new Logger("Global");