import * as fs from 'fs';
import * as Discord from 'discord.js';

import Trello from './integrations/trello';
import AssignCard from './commands/assign';
import System from './core/system';

let discord_token;

// Load env from store
if(fs.existsSync('secrets.store')) {
  const contents = JSON.parse(fs.readFileSync('secrets.store', { encoding: 'utf8' }));
  this.process.env = { ...this.process.env, ...contents };
}

if(process.env.DISCORD_TOKEN)
  discord_token = process.env.DISCORD_TOKEN;
else
  throw new Error("No keys found");

const client = new Discord.Client();
const system = new System(
  [
    AssignCard,
  ],
  [
    new Trello(),
  ],
);

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));
client.on('message', msg => system.on_message(msg));

client.login(discord_token);
