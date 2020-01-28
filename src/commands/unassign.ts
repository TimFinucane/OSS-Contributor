import { User } from "discord.js";

import { Arguments } from "../core/arguments";
import Command, { CommandContext } from "../core/context";
import Trello from "../integrations/trello";

const board_id = 'ZVcDitv0';

/**
 * Assign a supplied user to a supplied card.
 * @param context
 * @param parameters
 */
async function unassign_card(context: CommandContext, args: Arguments) {
  const user = args.by_name.user as User || context.author;
  const assign_names = args.by_name.cards as string[];

  const trello = context.get_integration<Trello>(Trello.integration_name);
  if(!trello)
    throw new Error("Trello integration not present");

  // Go through each card mentioned, and find the potential card/s the user could mean
  const all_cards = await trello.get_cards(board_id);
  const matches = assign_names.map(assign_name => all_cards.filter(card => card.name.toLowerCase().includes(assign_name.toLowerCase())));

  const assignable_cards = [];
  for(let i = 0; i < matches.length; ++i) {
    // Each card name could match multiple cards, in a card-set
    const card_set = matches[i];

    // If there is exactly one card, use that.
    // If there are multiple matches, but one is EXACT, then use that.
    // Otherwise warn the user
    if(card_set.length === 0)
      return await context.send_message(`Card "${assign_names[i]}" not found`);
    else if(card_set.length === 1)
      assignable_cards.push(card_set[0]);
    else { // Multiples
      // Try to find an exact match
      const found_card = card_set.find(card => card.name === assign_names[i]);
      if(found_card)
        assignable_cards.push(found_card);
      else {
        // If there are few enough cards, display the cards that match. Otherwise, just say there are too many.
        let message = `Name "${assign_names[i]}" too ambiguous, ${card_set.length} matches found`;
        if(card_set.length <= 3)
          message += ": " + card_set.map(card => card.name).join(', ');
        else
          message += ".";

        return await context.send_message(message);
      }
    }
  }

  for(const card of assignable_cards) {
    if(card.assignee !== user.tag)
      return await context.send_message(`The card '${card.name}' is not assigned to ${user}`);
  }

  // Finally assign all found cards
  await Promise.all(assignable_cards.map(card => trello.set_assignee(board_id, card.id, "")));

  // And inform the user
  await context.send_message(`Unassigned ${user} from ` + assignable_cards.map(card => card.name).join(", "));
}

const AssignCard: Command = {
  name: "Unassign Card",
  command_name: 'unassign',
  description: "Unassign a card on the trello board from a user",

  arguments: [
    {
      name: 'user',
      type: 'user',
      optional: true,
      suffix: ' from'
    },
    {
      name: 'cards',
      type: 'string',
      is_array: true
    }
  ],
  run: unassign_card,
};

export default AssignCard;
