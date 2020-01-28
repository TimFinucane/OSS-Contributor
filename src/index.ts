import * as fs from 'fs';
import * as Discord from 'discord.js';

import System from './core/system';
import Trello from './integrations/trello';
import AssignCard from './commands/assign';
import UnassignCard from './commands/unassign';

let discord_token;

// Load env from store
if(fs.existsSync('secrets.store')) {
  const contents = JSON.parse(fs.readFileSync('secrets.store', { encoding: 'utf8' }));
  process.env = { ...process.env, ...(contents || {}) };
}

if(process.env.DISCORD_TOKEN)
  discord_token = process.env.DISCORD_TOKEN;
else
  throw new Error("No keys found");

const client = new Discord.Client();
const system = new System(
  [
    AssignCard,
    UnassignCard,
  ],
  [
    new Trello(),
  ],
);

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));
// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on('message', msg => system.on_message(msg));

client.login(discord_token);
