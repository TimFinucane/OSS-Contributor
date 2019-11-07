import { User, Message } from "discord.js";
// TODO: Everything should work without discord eventually

import { ArgumentSpecs, Arguments } from "./arguments";
import { CommandContext } from "./context";

/**
 * An integration is set up on program start.
 * Every time a command is started and an integration is requested,
 * this integration class will be called with generate(), to give the integration
 * the correct message context.
 *
 * This allows the integration to preset things,
 * such as if certain variables are based on the channel the message was in.
 */
export abstract class Integration {
  public abstract name: string;
  // Generate an integration with context from a discord message
  public abstract generate(message: Message): any;
}

export interface CommandContext {
  // Replying on the same message channel
  send_message(message: string): Promise<any>;
  react(emoji: string): Promise<any>;
  can_react(): boolean;

  // Get the author of the message
  author: User;

  get_integration<T extends Integration>(name: string): ReturnType<T['generate']> | undefined;
}

export default interface Command {
  name: string;
  command_name: string;
  description: string;

  arguments: ArgumentSpecs;
  run(context: CommandContext, args: Arguments): Promise<void>;
}

