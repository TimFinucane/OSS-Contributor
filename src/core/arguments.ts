import { Message, User } from "discord.js";

/*
 * A very simple argument parsing library
 * to make it easier to write commands
 */

// Definition of the arguments, usually provided by command
type ArgumentType = 'user' | 'string' | 'any';
interface ArgumentSpec {
  name?: string;
  type: ArgumentType;
  is_array?: boolean;
  optional?: boolean;
  suffix?: string;
}
export type ArgumentSpecs = ArgumentSpec[];

// Arguments given to the command (based on the argument parser)
type Argument = User | string | (User | string)[];
export class Arguments extends Array<Argument> {
  constructor(length: number) {
    super();
    this.fill(undefined as any, length);
  }

  public by_name: { [name: string]: Argument } = {};
}

// Inner stuff
type InnerArgumentSpec = ArgumentSpec & { index: number; is_last: boolean };
export class ArgumentParsingException extends Error {}

/**
 * Parses an argument spec set
 */
export class ArgumentParser {
  constructor(spec: ArgumentSpecs) {
    this.spec = spec.map((value, index) => ({ ...value, index, is_last: index === spec.length - 1 }));
  }

  public help() {
    // TODO:
  }

  /**
   * Parses a discord message and returns the arguments.
   * @param message The discord message
   * @throws When
   */
  public parse(message: Message) {
    let remaining = message.content;
    const args = new Arguments(this.spec.length);

    this.spec.forEach(element => {
      remaining = ArgumentParser.parse_argument(element, args, message, remaining);
      remaining = remaining.trimLeft();
    });

    if(remaining !== "")
      throw new ArgumentParsingException(`Whole message was not parseable. "${remaining}" could not be put into an argument`);

    return args;
  }

  /**
   * Parses a single argument in the argument specs list. Will attempt to parse only from the start of the string.
   * @param spec The single argument specification
   * @param is_last Whether or not this is the last argument in the specification
   * @param args The current arguments. This is an output parameter, and any found argument will be added to it.
   * @param message The whole discord message, used for any necessary context lookup
   * @param remaining The string from which parsing should start.
   */
  private static parse_argument(spec: InnerArgumentSpec, args: Arguments, message: Message, remaining: string): string {
    let regex;

    // When an array, we look out for potential commas at the end.
    // When this is the last argument, we will try and take all the remaining text.
    if(spec.is_array && spec.is_last)
      regex = /^(?:<@!(\d+)>|\"(.*?)\"|\'(.*?)\'|([^\s,]+)),?/;
    else if(spec.is_array)
      regex = /^(?:<@!(\d+)>|\"(.*?)\"|\'(.*?)\'|([^\s,]+)),?/;
    else if(spec.is_last)
      regex = /^(?:<@!(\d+)>|\"(.*?)\"|\'(.*?)\'|(.+))/;
    else
      regex = /^(?:<@!(\d+)>|\"(.*?)\"|\'(.*?)\'|([^\s]+))/;

    let match = regex.exec(remaining);
    if(!match) {
      if(spec.optional)
        return remaining;
      else
        throw new ArgumentParsingException(`Unable to get match for argument ${spec.name || `[${spec.index}]`} from string "${remaining}"`);
    }

    let output_arg;
    let output_remaining = remaining;
    if(spec.is_array) {
      output_arg = [];

      // We need a comma at the end to allow us to continue looking for arguments
      while(match && match[0].endsWith(',')) {
        output_arg.push(this.match_single_arg(match, spec.type, message));
        output_remaining = output_remaining.trimLeft().slice(match[0].length);
        match = regex.exec(output_remaining.trimLeft());
      }

      // TODO
      if(match) {
        output_arg.push(this.match_single_arg(match, spec.type, message));
        output_remaining = output_remaining.trimLeft().slice(match[0].length);
      }
    }
    else {
      output_arg = this.match_single_arg(match, spec.type, message);
      output_remaining = output_remaining.slice(match[0].length);
    }

    // Deal with the suffix at the end: If it's there we remove it. If not, then we un-apply everything.
    if(spec.suffix) {
      if(output_remaining.startsWith(spec.suffix))
        output_remaining = output_remaining.slice(spec.suffix.length);
      else if(spec.optional)
        return remaining;
      else
        throw new ArgumentParsingException(`Could not find required suffix ${spec.suffix} to argument ${spec.name || `[${spec.index}]`}`);
    }

    args[spec.index] = output_arg;
    if(spec.name)
      args.by_name[spec.name] = output_arg;

    return output_remaining;
  }

  /**
   * Check and confirm a single found value-match
   * @param match The match found
   * @param type The type the match should be
   * @param context Information about discord
   *
   * @returns The found value. Users are returned as Discord.Users
   * @throws If the value is not the right type, or the user was not found
   */
  private static match_single_arg(match: RegExpExecArray, type: ArgumentType, context: Message) {
    if(match[1] && type === 'string')
      throw new ArgumentParsingException("Unexpected user");
    else if(!match[1] && type === 'user')
      throw new ArgumentParsingException("Expected user");

    return match[2] || match[3] || match[4] || ArgumentParser.find_user_from_id(context, match[1]);
  }

  /**
   * Find a user given their id.
   * @param context The discord message in which the id was found
   * @param id The id as a string, digits only.
   */
  private static find_user_from_id(context: Message, id: string) {
    const user = context.mentions.users.get(id);
    if(!user)
      throw new ArgumentParsingException(`Unable to find user from id ${id}`);

    return user;
  }

  private spec: InnerArgumentSpec[];
}
