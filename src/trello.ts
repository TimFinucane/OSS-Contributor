import fetch from 'node-fetch';

// Globals
// The trello api key and token
let key: string | undefined, token: string | undefined;
// The board field id to use in assignment
let assignee_field_id: string | undefined;

export function set_trello_keys(trello_key: string, trello_token: string) {
  key = trello_key;
  token = trello_token;
}

export interface Card {
  name: string;
  id: string;
}
export interface CustomField {
  name: string;
  id: string;
}

/**
 * Find the custom field to use for setting the assignee
 */
export async function get_assignee_field(board: string) {
  console.log("Figuring out assignee field");

  // Try to find the assignee field
  const fields_request = await fetch(`https://api.trello.com/1/boards/${board}/customFields/?fields=name&key=${key}&token=${token}`);
  const fields: CustomField[] = await fields_request.json();

  const field = fields.find(field => field.name.toLowerCase() === 'assignee');
  if(field)
    assignee_field_id = field.id
  else {
    console.error("Unable to find assignee field");
    console.log(fields);
  }
}

/**
 * Find cards that match the given partial string
 * @param card
 */
export async function find_cards(board: string, partial: string) {
  // Find the card name
  const cards_request = await fetch(`https://api.trello.com/1/boards/${board}/cards/?fields=name&key=${key}&token=${token}`);
  const cards: Card[] = await cards_request.json();

  // Find a card that matches the name
  const found_cards = cards.filter(c => c.name.toLowerCase().includes(partial.toLowerCase()))
  return found_cards;
}


/**
 * Assign a card to a given assignee
 * @param card_id
 * @param assignee
 */
export async function assign_card(board: string, card_id: string, assignee: string) {
  // Try to find the assignee field
  if(!assignee_field_id)
    await get_assignee_field(board);

  const result = await fetch(
    `https://api.trello.com/1/card/${card_id}/customField/${assignee_field_id}/item?key=${key}&token=${token}`,
    {
      method: 'PUT',
      body: JSON.stringify({ value: { text: assignee } }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if(!result.ok)
    console.error(await result.text());
}
