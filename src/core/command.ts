
// TODO:
export interface UserReference {
  // What to use in external services or logging
  name: string;

  // For use by command integration service
  toString(): string;
}

export interface IntegrationContext {
  send_message(...message: (string | UserReference)[]): Promise<any>;
  react(): Promise<any>;
  can_react(): boolean;

  // Get info about a user from a string
  get_user(name: string): UserReference;
  // Get the author of the message
  author: UserReference;
}


export default interface Command {
  name: string;
  command_name: string;
  description: string;

  run(context: IntegrationContext, args: string): void;
}
