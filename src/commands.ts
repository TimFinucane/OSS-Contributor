import * as trello from './trello';
import { Message } from 'discord.js';

const board_id = 'V7Wct160';

export interface UserReference {
  // What to use in external services or logging
  name: string;

  // For use by command integration service
  toString(): string;
}

export interface IntegrationContext {
  send_message(...message: (string | UserReference)[]): Promise<any>;
  react(): Promise<any>;
  can_react(): boolean;

  // Get info about a user from a string
  get_user(name: string): UserReference;
  // Get the author of the message
  author: UserReference;
}

export default class CommandReciever {
  public async parse_message(message: Message) {
    // Get the assign command
    const splitIndex = message.content.indexOf(' ');
    const command = message.content.slice(0, splitIndex);
    const parameters = message.content.slice(splitIndex + 1);

    const context: IntegrationContext = {
      send_message: (...msg: (string | UserReference)[]) => message.channel.send(msg.join(' ')),
      react: async () => {},
      can_react: () => false,

      get_user: (name: string) => {
        const id = name.replace(/^<@!|>$/g, '');
        const user = message.mentions.users.get(id);
        if(!user) {
          console.error(`Unable to find user from id ${id}`);
          throw Error();
        }

        return { name: user.tag, toString: () => user.toString() };
      },
      author: ({ name: message.author.tag, toString: () => message.author.toString() }),
    }

    switch(command) {
      case '!assign':
        return await this.assign(context, parameters);
      default:
        return await message.channel.send("Unrecognised command. Must be of the form 'assign [name|self] to [card name]");
    }
  }

  /**
   * Assign a supplied user to a supplied card.
   * @param context
   * @param parameters
   */
  private async assign(context: IntegrationContext, parameters: string) {
    // Get the seperate parts of the command
    // This regex matches (["]user["] to card) or (card)
    const matches = parameters.match(/^(?:(?:\"(.*?)\"|(.*?)) to )?(?:\"(.*?\")|(.*?))$/);
    if(!matches) {
      console.log("Incorrect parameters format.");
      return context.send_message('Format incorrect, parameters to command should be of form: (["]user["] to card) or (card)');
    }
    // If the user wasn't supplied in parameters, use author.
    console.log(matches);
    let user;
    if(matches[1] || matches[2]) {
      user = context.get_user(matches[1] || matches[2])
      if(!user) {
        console.error(`Unable to find user ${matches[1] || matches[2]}`);
        context.send_message(`Unable to find user ${matches[1] || matches[2]}`);
      }
    }
    else
      user = context.author;
    const card_name = matches[3] || matches[4];

    console.log(`Using ${user.name} as user and ${card_name} as partial card name`);

    // Find the card we want
    const cards = await trello.find_cards(board_id, card_name);
    if(cards.length === 0)
      return await context.send_message(`Card ${card_name} not found`);
    else if(cards.length > 1)
      return await context.send_message(`Card name ${card_name} too ambiguous, ${cards.length} matches found.`);

    const card = cards[0];
    await trello.assign_card(board_id, card.id, user.name);

    await context.send_message(`Assigned ${user} to ${card.name}`);
  }
  private async unassign(context: IntegrationContext, parameters: string) {

  }
  private async get_wip(context: IntegrationContext, parameters: string) {

  }
  private async get_user_status(context: IntegrationContext, parameters: string) {

  }
  private async get_card_status(context: IntegrationContext, parameters: string) {

  }
  private async get_random_card(context: IntegrationContext, parameters: string) {

  }

}
