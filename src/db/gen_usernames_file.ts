// merge usernames.txt and valid_email_usernames.txt into valid_email_usernames.txt

import { readFileSync, writeFileSync } from "fs";

const usernames = readFileSync("usernames.txt", "utf-8").split("\n");
const validEmailUsernames = readFileSync("valid_email_usernames.txt", "utf-8").split("\n");

const validEmailUsernamesSet = new Set(usernames);

for (const username of validEmailUsernames) {
    validEmailUsernamesSet.add(username);
}

writeFileSync("valid_email_usernames.txt", Array.from(validEmailUsernamesSet).join("\n"));
