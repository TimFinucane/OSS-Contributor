import * as fs from 'fs';
import * as Discord from 'discord.js';
import CommandReciever from './commands';
import { set_trello_keys } from './trello';

let discord_token;

if(process.env.TRELLO_KEY && process.env.TRELLO_TOKEN && process.env.DISCORD_TOKEN) {
  set_trello_keys(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
  discord_token = process.env.DISCORD_TOKEN;
}
else if(fs.existsSync('secrets.store')) {
  const contents = JSON.parse(fs.readFileSync('secrets.store', { encoding: 'utf8' }));
  set_trello_keys(contents.trello_key, contents.trello_token);
  discord_token = contents.discord_token;
}
else
  throw new Error("No keys found");

const client = new Discord.Client();
const commands = new CommandReciever();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if(msg.content.startsWith('!'))
    commands.parse_message(msg);
});

client.login(discord_token);
