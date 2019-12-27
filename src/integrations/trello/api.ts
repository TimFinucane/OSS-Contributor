import fetch from "node-fetch";

type CustomFieldValue = { text: string } | { something: void };

interface Card {
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

async function get_nested_cards(board_id: string, key: string, token: string) {
  return await fetch(`https://api.trello.com/1/boards/${board_id}/customFields/?fields=name&key=${key}&token=${token}`);
}
