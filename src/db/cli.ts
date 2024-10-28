import { eq, sql } from "drizzle-orm";
import { db } from ".";
import { HouseOptions, logs, questionResponses, questions, sessions, teams, users, validUsernames, type House } from "./schema";
import { Team } from "@/utils/models/Team";

import fs from "fs";
import path from "path";

import kleur from "kleur";
import { GlobalLogger } from "@/utils/models/Logger";
import { genPassword } from "@/utils";
import { kv } from "@/utils/kv";
import { hashPassword } from "@/utils/auth";
import { Question } from "@/utils/models/Question";
import { incrementQuestion } from "@/utils/funcs/team";

type TeamConstructor = ConstructorParameters<typeof Team>;

const teamsData: TeamConstructor[] = [
    ["sagar", 0, true],
    ["vasundhara", 0, true],
    ["srishti", 0, true],
    ["himgiri", 0, true],
    ["alumni", 0, true]
];

interface CommandMappings {
    command: string;
    action: () => Promise<void>;
    description?: string;
}


function writeCSV(data: string[][], filename: string) {
    const csv = data.map(row => row.join(",")).join("\n");
    fs.writeFileSync(path.join(__dirname, filename), csv);
}

const commands: CommandMappings[] = [
    {
        command: "reset scores",
        action: async () => {
            console.log(kleur.bold().blue("Resetting team scores..."));
            await db.update(teams).set({ points: 0 });
            console.log(kleur.green().bold("Reset complete"));
        },
        description: "Resets all team scores to 0"
    },
    {
        command: "reset teams",
        action: async () => {
            console.log(kleur.bold().blue("Resetting team current question ids to -1..."));
            await db.update(teams).set({ currentQuestionId: '-1', hasFinished: false, levelUpTime: null, bannedUntil: null });
            const resetScoresCommand = commands.find(c => c.command.startsWith("reset scores"));
            if (!resetScoresCommand) {
                console.error(kleur.red().bold("Reset scores command not found"));
                process.exit(1);
            }
            await resetScoresCommand.action();
        },
        description: "Resets all team current question ids to -1"
    },
    {
        command: "start game",
        action: async () => {
            console.log(kleur.bold().blue("Starting game..."));
            await db.update(teams).set({ hasFinished: false });
            const firstQuestion = await db.query.questions.findFirst({ where: (q, { eq }) => eq(q.position, 1) });
            if (!firstQuestion) {
                console.error(kleur.red().bold("No questions found"));
                process.exit(1);
            }
            await db.update(teams).set({ currentQuestionId: firstQuestion.id });
            await kv.set("ch:started", true);
            console.log(kleur.green().bold("Game started"));
        },
        description: "Starts the game"
    },
    {
        command: "set current question ;id;",
        action: async () => {
            console.log(kleur.bold().blue("Setting current question for all teams..."));
            const currentQuestionId = command.split(" ")[3];
            if (!currentQuestionId) {
                console.error(kleur.red().bold("Invalid question id"));
                process.exit(1);
            }
            await db.update(teams).set({ currentQuestionId: currentQuestionId });
            console.log(kleur.green().bold(`Set current question for all teams to '${currentQuestionId}'`));
        },
        description: "Sets the current question for all teams"
    },
    {
        command: "seed teams ;--clear;",
        action: async () => {
            let csvData: string[][] = [["name", "password"]];
            console.log(kleur.bold().blue("Seeding teams..."));
            const clear = command.includes("--clear");
            if (clear) {
                console.log(kleur.bold().yellow("Clearing teams..."));
                await db.delete(teams);
                console.log(kleur.green().bold("Cleared teams"));
            }
            // seed teams and log the password + a message
            for (const teamData of teamsData) {
                let team = new Team(...teamData);
                await team.create({ consoleLog: false }).then((res) => {
                    console.log(kleur.green(`Team '${team.name}' created with password: ${kleur.blue(res.password)}`));
                    csvData.push([res.name, res.password]);
                }).catch(async (e) => {
                    if (e.message === "Team name already exists") {
                        console.log(kleur.yellow(`Team '${team.name}' already exists`));
                        return;
                    }
                    throw e;
                });
            }
            writeCSV(csvData, "teams.csv");
            await GlobalLogger.info("Seeded teams");
            console.log(kleur.green().bold("Seeding complete"));
        },
        description: "Seeds teams into the database and writes their info to teams.csv"
    },
    {
        command: "clear teams",
        action: async () => {
            console.log(kleur.bold().blue("Clearing teams..."));
            await db.delete(teams);
            await GlobalLogger.info("All teams cleared");
            console.log(kleur.green().bold("Clear complete"));
        },
        description: "Clears all teams from the database"
    },
    {
        command: "clear users",
        action: async () => {
            console.log(kleur.bold().blue("Clearing users..."));
            await db.run(sql`DELETE FROM users`);
            await GlobalLogger.info("All users cleared");
            console.log(kleur.green().bold("Clear complete"));
        },
        description: "Clears all users from the database"
    },
    {
        command: "add usernames",
        action: async () => {
            console.log(kleur.bold().blue("Adding valid usernames..."));
            const validUsernamesList = fs.readFileSync(path.resolve(__dirname, "./valid_email_usernames.txt"), "utf-8").split("\n");
            const data = validUsernamesList.map((username) => ({ username }));
            await db.insert(validUsernames).values(data).onConflictDoNothing();
            console.log(kleur.green().bold("Added all usernames"));
        },
        description: "Adds all valid usernames from valid_email_usernames.txt"
    },
    {
        command: "add username ;username;",
        action: async () => {
            const username = command.split(" ")[2];
            if (!username) {
                console.error(kleur.red().bold("Invalid username"));
                process.exit(1);
            }
            console.log(kleur.bold().blue("Adding username..."));
            await db.insert(validUsernames).values({ username }).onConflictDoNothing();
            console.log(kleur.green().bold(`Added username '${username}'`));
        },
        description: "Adds a username to the database"
    },
    {
        command: "clear usernames",
        action: async () => {
            console.log(kleur.bold().blue("Clearing usernames..."));
            await db.delete(validUsernames);
            console.log(kleur.green().bold("Cleared all usernames"));
        },
        description: "Clears all usernames from the database"
    },
    {
        command: "setgen admin password",
        action: async () => {
            const password = await genPassword(5);
            console.log(kleur.bold().blue("Setting admin password..."));
            await kv.set("admin:password", await hashPassword(password));
            console.log(kleur.green().bold(`Admin password set to '${password}'`));
        },
        description: "Sets a random password for the admin - make sure to note it down"
    },
    {
        command: "add oc ;username;",
        action: async () => {
            const usernames = (command.split(" ")[2]).split(",");
            if (!usernames || usernames.length === 0) {
                console.error(kleur.red().bold("Invalid username(s)"));
                process.exit(1);
            }
            console.log(kleur.bold().blue("Adding OC..."));
            const isValid = usernames.every(async (username) => await db.query.validUsernames.findFirst({ where: (v, { eq }) => eq(v.username, username) }));
            if (!isValid) {
                console.error(kleur.red().bold("Invalid username"));
                process.exit(1);
            }
            await db.insert(users).values(
                usernames.map((username) => ({
                    role: "oc" as any,
                    username: username.toString()
                }))
            ).onConflictDoUpdate({
                set: { role: "oc" },
                target: [users.username],
            });
            console.log(kleur.green().bold(`Added OC(s) '${usernames.join(",")}'`));
        },
        description: "Adds an OC to the database"
    },
    {
        command: "add admin ;username;",
        action: async () => {
            const username = command.split(" ")[2];
            if (!username) {
                console.error(kleur.red().bold("Invalid username"));
                process.exit(1);
            }
            console.log(kleur.bold().blue("Adding admin..."));
            const isValid = await db.query.validUsernames.findFirst({ where: (v, { eq }) => eq(v.username, username) });
            if (!isValid) {
                console.error(kleur.red().bold("Invalid username"));
                process.exit(1);
            }
            await db.insert(users).values({ username, role: "admin" }).onConflictDoUpdate({
                set: { role: "admin" },
                target: [users.username],
            });
            console.log(kleur.green().bold(`Added admin '${username}'`));
        },
        description: "Adds an admin to the database"
    },
    {
        command: "set admin password ;password;",
        action: async () => {
            const password = command.split(" ")[4];
            if (!password) {
                console.error(kleur.red().bold("Invalid password"));
                process.exit(1);
            }
            console.log(kleur.bold().blue("Setting admin password..."));
            await kv.set("admin:password", await hashPassword(password));
            console.log(kleur.green().bold(`Admin password set to '${password}'`));
        },
        description: "Sets the admin password - use this only if you know what you're doing or for testing"
    },
    {
        command: "setgen admin token",
        action: async () => {
            const randomValues = crypto.getRandomValues(new Uint8Array(20));
            const token = Array.from(randomValues, (dec) => dec.toString(16).padStart(2, "0")).join("");
            console.log(kleur.bold().blue("Setting admin API key..."));
            await kv.set("admin:token", await hashPassword(token));
            console.log(kleur.green().bold(`Admin token set to '${token}'`));
        },
        description: "Sets a random API token for the admin - make sure to note it down"
    },
    {
        command: "normalize question positions",
        action: async () => {
            console.log(kleur.bold().blue("Normalizing question positions..."));
            await Question.normalizePositions();
            console.log(kleur.green().bold("Normalized question positions"));
        },
        description: "Normalizes question positions"
    },
    {
        command: "set all question points ;points;",
        action: async () => {
            const points = Number(command.split(" ")[4]);
            console.log(kleur.bold().blue(`Setting all question points to '${points}'...`));
            await db.update(questions).set({ points });
            console.log(kleur.green().bold(`Set all question points to '${points}'`));
        },
        description: "Sets all question points to a specified value"
    },
    {
        command: "reset crypthunt",
        action: async () => {
            console.log(kleur.bold().red("Wiping database..."));
            await db.delete(teams);
            await db.delete(users);
            await db.delete(logs);
            await db.delete(questions);
            await db.delete(questionResponses);
            await db.delete(sessions);
            await kv.delete("ch:started");
            await kv.delete("ch:paused");
            await GlobalLogger.info("Database wiped");
            console.log(kleur.green().bold("Database wiped"));
            // seed teams
            const seedTeamsCommand = commands.find(c => c.command.startsWith("seed teams"));
            if (!seedTeamsCommand) {
                console.error(kleur.red().bold("Seed teams command not found"));
                process.exit(1);
            }
            await seedTeamsCommand.action();
        },
        description: "Resets the game for a fresh start"
    },
    {
        command: "increment question ;teamName;",
        action: async () => {
            const teamName = command.split(" ")[2];
            if (!teamName || HouseOptions.some(h => h === teamName) === false) {
                console.error(kleur.red().bold("Invalid team name"));
                process.exit(1);
            }
            console.log(kleur.bold().blue(`Incrementing question for team '${teamName}'...`));
            const team = await db.query.teams.findFirst({ where: eq(teams.name, teamName.toLowerCase() as House) });
            if (!team) {
                console.error(kleur.red().bold("Team not found"));
                process.exit(1);
            }
            const currentQuestion = await db.query.questions.findFirst({ where: (q, { eq }) => eq(q.id, team.currentQuestionId) });
            if (!currentQuestion) {
                console.error(kleur.red().bold("Current question not found"));
                process.exit(1);
            }
            await incrementQuestion(team, currentQuestion);
            console.log(kleur.green().bold(`Incremented question for team '${teamName}'`));
        },
        description: "Increments the question for a team"
    },
    {
        command: "add random questions ;count;",
        action: async () => {
            const count = Number(command.split(" ")[3]);
            if (!count || count <= 0) {
                console.error(kleur.red().bold("Invalid count"));
                process.exit(1);
            }
            console.log(kleur.bold().blue(`Adding ${count} random questions...`));
            const questionsData = Array.from({ length: count }, (_, i) => {
                return {
                    title: `Question ${i + 1}`,
                    position: i + 1,
                    content: `Content for question ${i + 1}`,
                    answer: `answer${i + 1}`,
                    points: 1,
                    type: "online" as any
                };
            });
            await db.insert(questions).values(questionsData);
            console.log(kleur.green().bold(`Added ${count} random questions`));
        },
        description: "Adds random questions to the database"
    },
    {
        command: "clear questions",
        action: async () => {
            console.log(kleur.bold().blue("Clearing questions..."));
            await db.delete(questions);
            console.log(kleur.green().bold("Cleared questions"));
        },
        description: "Clears all questions from the database"
    }
];

const args = process.argv.slice(2);
const command = args.join(" ").toLowerCase();

(async () => {
    for (const cmd of commands) {
        // cmd can take in later args wrapped in semicolons, pass in these args as well
        if (command === "help") {
            console.log(kleur.bold().magenta("Commands"), "\n");
            for (const cmd of commands.toSorted((a, b) => a.command.localeCompare(b.command))) {
                console.log(kleur.bold().green(`- ${cmd.command}`));
                if (cmd.description) {
                    console.log("   ", kleur.blue(cmd.description));
                }
            }
            process.exit(0);
        }

        if (command.startsWith(cmd.command.split(";")[0].trim())) {
            await cmd.action();
            process.exit(0);
        }
    }
    console.error(kleur.red().bold("Invalid command"));
    process.exit(1);
})();