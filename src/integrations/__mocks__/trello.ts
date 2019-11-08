import "jest";

import { Card } from '../trello';

const trello: typeof import('../trello') = jest.genMockFromModule('../trello');

const cards: (Card & { assignee?: string })[] = [
  {
    name: 'Card 1',
    id: '1'
  },
  {
    name: 'Card 2',
    id: '2'
  },
  {
    name: 'Attach',
    id: '3'
  },
  {
    name: 'Prepare',
    id: '4'
  }
];

export default class Trello {
  public static integration_name = 'trello';
  public name = Trello.integration_name;

  public generate() {
    return this;
  }

  public set_cards(new_cards: Card[]) {
    this.cards = new_cards;
  }

  public async find_cards(board: string, partial: string): Promise<Card[]> {
    return Promise.resolve(this.cards.filter(card => card.name.toLowerCase().includes(partial.toLowerCase())));
  }
  public async assign_card(board: string, card_id: string, assignee: string) {
    const card = this.cards.find(card => card.id === card_id);
    if(card)
      card.assignee = assignee;
    else
      throw new Error(`Card ${card_id} not found`);

    return Promise.resolve(true);
  }

  public cards = cards;
}

trello.default = Trello as any;
