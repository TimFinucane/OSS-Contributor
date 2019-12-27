import fetch from "node-fetch";

import { TrelloConfiguration } from "./configuration";

export interface CustomField {
  name: string;
  id: string;
}

export interface BoardInfo {
  assignee_field: CustomField;
}

export async function load_board(configuration: TrelloConfiguration, board_id: string): Promise<BoardInfo> {
  console.log(`Loading ${board_id} board info`);

  // Try to find the assignee field
  const fields_request = await fetch(
    `https://api.trello.com/1/boards/${board_id}/customFields/?fields=name&key=${this.key}&token=${this.token}`
  );
  const fields: CustomField[] = await fields_request.json();

  const field = fields.find(field => field.name.toLowerCase() === configuration.default_assignee_field);
  if(!field) {
    console.error("Unable to find assignee field");
    console.log(fields);

    throw new Error("Unable to find assignee field");
  }

  return { assignee_field: { id: field.id, name: field.name } };
}
