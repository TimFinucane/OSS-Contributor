import fetch from "node-fetch";

type CustomFieldValue = { text: string };

export interface Card {
  id: string;
  name: string;
  customFieldItems: {
    id: string;
    value: CustomFieldValue;
    // Model stuff? Dunno what it's for
    idCustomField: string;
    idModel: string;
    modelType: 'card';
  }[];
}

export interface CustomField {
  id: string;
  idModel: string;
  modelType: 'board';
  fieldGroup: string;
  display: {
    cardFront: boolean;
  };
  name: string;
  pos: number;
  type: 'text' | string;
}

export function get_nested_cards(board_id: string, key: string, token: string): Promise<Card[]> {
  return fetch(
    `https://api.trello.com/1/boards/${board_id}/customFields/?fields=name&key=${key}&token=${token}`
  ).then(res => res.json());
}

export function get_custom_fields(board_id: string, key: string, token: string): Promise<CustomField[]> {
  return fetch(`https://api.trello.com/1/boards/${board_id}/customFields/?fields=name&key=${key}&token=${token}`)
    .then(res => res.json());
}

export function set_card_custom_field(card_id: string, field_id: string, value: string, key: string, token: string) {
  return fetch(
    `https://api.trello.com/1/card/${card_id}/customField/${field_id}/item?key=${key}&token=${token}`,
    {
      method: 'PUT',
      body: JSON.stringify({ value: { text: value } }),
      headers: {
        'Content-Type': 'application/json'
      },
    }
  );
}
