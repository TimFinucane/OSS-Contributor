import fetch from 'node-fetch';
import { Integration } from '../../core/context';
import { BoardInfo, load_board } from './board';
import { TrelloConfiguration } from './configuration';

export interface Card {
  name: string;
  id: string;

  assignee: string;
}

export default class Trello extends Integration {
  public static integration_name = "trello";
  public name = Trello.integration_name;

  public constructor() {
    super();

    if(!process.env.TRELLO_KEY || !process.env.TRELLO_TOKEN)
      throw new Error("Cannot find keys for trello (TRELLO_KEY, TRELLO_TOKEN). Need to be present in secrets.store or environment");

    this.configuration = {
      key: process.env.TRELLO_KEY,
      token: process.env.TRELLO_TOKEN,
      default_assignee_field: 'assignee', // TODO:
    }
  }

  public initialize() {
    return undefined;
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
    const cards_request = await fetch(
      `https://api.trello.com/1/boards/${board}/cards/?fields=name&customFieldItems=true&key=${this.key}&token=${this.token}`
    );
    const cards: Card[] = await cards_request.json();

    // Find a card that matches the name
    const found_cards = cards.filter(c => c.name.toLowerCase().includes(partial.toLowerCase()));
    return found_cards;
  }

  /**
   * Assign a card to a given assignee
   * @param board_id
   * @param card_id
   * @param assignee
   */
  public async set_assignee(board_id: string, card_id: string, assignee: string) {
    // Try to find the assignee field
    const board = await this.get_board_info(board_id);

    const result = await fetch(
      `https://api.trello.com/1/card/${card_id}/customField/${board.assignee_field.id}/item?key=${this.configuration.key}&token=${this.configuration.token}`,
      {
        method: 'PUT',
        body: JSON.stringify({ value: { text: assignee } }),
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );

    if(!result.ok)
      console.error(await result.text());
  }

  private get_board_info(board: string) {
    const board_info = this.boards[board];

    if(board_info === undefined) {
      return load_board(this.configuration, board).then(info => {
        this.boards[board] = info;
        return info;
      })
    }
    else
      return board_info;
  }

  // The board field id to use in assignment
  private boards: { [id: string]: BoardInfo | undefined } = {};
  // The trello api key and token
  private configuration: TrelloConfiguration;
}
