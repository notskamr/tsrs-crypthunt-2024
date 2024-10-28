import { db } from "@/db";
import type { SelectUser } from "@/db/schema";

export async function getExpandedUser(user: SelectUser) {
    const userExpanded = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
        with: {
            team: {
                with: {
                    currentQuestion: true
                }
            }
        }
    });
    if (!userExpanded?.team) {
        throw Error("Team not found");
    }
    return userExpanded;
}