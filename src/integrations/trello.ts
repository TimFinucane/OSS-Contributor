import fetch from 'node-fetch';
import { Integration } from '../core/context';

export interface Card {
  name: string;
  id: string;
}
export interface CustomField {
  name: string;
  id: string;
}

export default class Trello extends Integration {
  public static integration_name = "trello";
  public name = Trello.integration_name;

  public constructor() {
    super();

    if(!process.env.TRELLO_KEY || !process.env.TRELLO_TOKEN)
      throw new Error("Cannot find keys for trello (TRELLO_KEY, TRELLO_TOKEN). Need to be present in secrets.store or environment");

    this.key = process.env.TRELLO_KEY;
    this.token = process.env.TRELLO_TOKEN;
  }

  public generate(/* message: Message */) {
    // TODO:
    return this;
  }

  /**
   * Find cards that match the given partial string
   * @param card
   */
  public async find_cards(board: string, partial: string) {
    // Find the card name
    const cards_request = await fetch(`https://api.trello.com/1/boards/${board}/cards/?fields=name&key=${this.key}&token=${this.token}`);
    const cards: Card[] = await cards_request.json();

    // Find a card that matches the name
    const found_cards = cards.filter(c => c.name.toLowerCase().includes(partial.toLowerCase()));
    return found_cards;
  }

  /**
   * Assign a card to a given assignee
   * @param card_id
   * @param assignee
   */
  public async assign_card(board: string, card_id: string, assignee: string) {
    // Try to find the assignee field
    if(!this.assignee_field_id)
      await this.get_assignee_field(board);

    const result = await fetch(
      `https://api.trello.com/1/card/${card_id}/customField/${this.assignee_field_id}/item?key=${this.key}&token=${this.token}`,
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

  /**
   * Find the custom field to use for setting the assignee
   */
  private async get_assignee_field(board: string) {
    console.log("Figuring out assignee field");

    // Try to find the assignee field
    const fields_request = await fetch(
      `https://api.trello.com/1/boards/${board}/customFields/?fields=name&key=${this.key}&token=${this.token}`
    );
    const fields: CustomField[] = await fields_request.json();

    const field = fields.find(field => field.name.toLowerCase() === 'assignee');
    if(field)
      this.assignee_field_id = field.id;
    else {
      console.error("Unable to find assignee field");
      console.log(fields);
    }
  }

  // The trello api key and token
  private key: string;
  private token: string;

  // The board field id to use in assignment
  private assignee_field_id: string | undefined;
}
