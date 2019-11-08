import { User } from "discord.js";

import { Arguments } from "../core/arguments";
import Command, { CommandContext } from "../core/context";
import Trello, { Card } from "../integrations/trello";

const board_id = 'z0H4ci3u';

/**
 * Assign a supplied user to a supplied card.
 * @param context
 * @param parameters
 */
async function assign_card(context: CommandContext, args: Arguments) {
  const user = args.by_name.user as User || context.author;
  const card_names = args.by_name.cards as string[];

  const trello = context.get_integration<Trello>(Trello.integration_name);
  if(!trello)
    throw new Error("Trello integration not present");

  // Go through each card mentioned, and find the potential card/s the user could mean
  const cards = await Promise.all(card_names.map(card_name => trello.find_cards(board_id, card_name)));

  const assignable_cards = [];
  for(let i = 0; i < cards.length; ++i) {
    // Each card name could match multiple cards, in a card-set
    const card_set = cards[i];

    // If there is exactly one card, use that.
    // If there are multiple matches, but one is EXACT, then use that.
    // Otherwise warn the user
    if(card_set.length === 0)
      return await context.send_message(`Card "${card_names[i]}" not found`);
    else if(card_set.length === 1)
      assignable_cards.push(card_set[0]);
    else { // Multiples
      // Try to find an exact match
      const found_card = card_set.find((card: Card) => card.name === card_names[i]);
      if(found_card)
        assignable_cards.push(found_card);
      else {
        // If there are few enough cards, display the cards that match. Otherwise, just say there are too many.
        let message = `Name "${card_names[i]}" too ambiguous, ${card_set.length} matches found`;
        if(card_set.length <= 3)
          message += ": " + card_set.map((card: Card) => card.name).join(', ');
        else
          message += ".";

        return await context.send_message(message);
      }
    }
  }
  // Finally assign all found cards
  await Promise.all(assignable_cards.map(card => trello.assign_card(board_id, card.id, user.tag)));

  // And inform the user
  await context.send_message(`Assigned ${user} to ` + assignable_cards.map(card => card.name).join(", "));
}

const AssignCard: Command = {
  name: "Assign Card",
  command_name: 'assign',
  description: "Assign a card on the trello board to a user",

  arguments: [
    {
      name: 'user',
      type: 'user',
      optional: true,
      suffix: ' to'
    },
    {
      name: 'cards',
      type: 'string',
      is_array: true
    }
  ],
  run: assign_card,
};

export default AssignCard;
