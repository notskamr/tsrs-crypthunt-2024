import type { Config } from 'drizzle-kit';
export default {
    schema: './src/db/schema.ts',
    out: './migrations',
    driver: 'turso',
    dbCredentials: {
        url: process.env.TURSO_DB_URL!,
        authToken: process.env.TURSO_DB_AUTH_TOKEN!,
    },
} satisfies Config;