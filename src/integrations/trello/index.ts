import { Integration } from '../../core/context';
import { BoardInfo, load_board } from './board';
import { TrelloConfiguration } from './configuration';
import * as api from './api';

export interface Card {
  name: string;
  id: string;

  assignee?: string;
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
    };
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
   */
  public async get_cards(board_id: string) {
    const board = await this.get_board_info(board_id);

    // Find all cards
    const cards = await api.get_nested_cards(board_id, this.configuration.key, this.configuration.token);

    return cards
      .map(card => ({ // Get the assignee field
        ...card,
        assignee: card.customFieldItems.find(item => item.id === board.assignee_field.id)?.value.text,
      }));
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
    const result = await api.set_card_custom_field(
      card_id,
      board.assignee_field.id,
      assignee,
      this.configuration.key,
      this.configuration.token
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
      });
    }
    else
      return board_info;
  }

  // The board field id to use in assignment
  private boards: { [id: string]: BoardInfo | void } = {};
  // The trello api key and token
  private configuration: TrelloConfiguration;
}
