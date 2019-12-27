import { TrelloConfiguration } from "./configuration";
import { get_custom_fields } from "./api";

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
  const fields = await get_custom_fields(board_id, configuration.key, configuration.token);

  const field = fields.find(field => field.name.toLowerCase() === configuration.default_assignee_field);
  if(!field) {
    console.error("Unable to find assignee field");
    console.log(fields);

    throw new Error("Unable to find assignee field");
  }

  return { assignee_field: { id: field.id, name: field.name } };
}
