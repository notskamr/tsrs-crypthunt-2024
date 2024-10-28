const teamsFile = Bun.file("src/db/teams.csv");

const teamsText = await teamsFile.text();

const teams = teamsText.split("\n").slice(1).map((line) => {
    const [name, password] = line.split(",");
    return { name, password };
});

for (const team of teams) {
    await Bun.write(
        `src/db/team_messages/${team.name}.txt`,
        `
https://crypthunt.tsrs.tech
*House Password:* ${team.password}
    
Starts at 6pm on 17th May (Friday)
    
Rules: https://crypthunt.tsrs.tech/rules
About: https://crypthunt.tsrs.tech/about`.trim());
}

export { };

