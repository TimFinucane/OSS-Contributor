import { Message } from "discord.js";

import Command, { Integration } from "./context";
import { ArgumentParser } from "./arguments";

export default class System {
  public constructor(private commands: Command[], private integrations: Integration[]) { }

  // Recieving a message
  public async on_message(message: Message) {
    const matches = /^!([^ ]+) (.*)$/.exec(message.content);
    if(!matches)
      return;

    const command_name = matches[1];
    const parameter_string = matches[2];

    const command = this.commands.find(command => command.command_name === command_name);
    if(!command) {
      await message.channel.send(`Command ${command_name} not found`);
      return;
    }

    const args = new ArgumentParser(command.arguments).parse(message, parameter_string);
    await command.run(this.generate_context(message), args);
  }

  private generate_context(message: Message) {
    return {
      send_message: (msg: string) => message.channel.send(msg),
      react: (emoji: string) => message.react(emoji),
      can_react: () => false,

      author: message.author,

      get_integration: <T extends Integration>(name: string): T | undefined => {
        const integration = this.integrations.find(integration => integration.name.localeCompare(name) === 0);
        return integration && (integration.generate(message) as T);
      }
    };
  }
}
