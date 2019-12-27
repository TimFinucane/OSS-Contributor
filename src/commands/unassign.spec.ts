import "jest";
import { Message, Collection, User } from "discord.js";

import System from "../core/system";
import Trello, { default_cards } from "../integrations/__mocks__/trello";
import UnassignCard from "./unassign";

const trello = new Trello();
const system = new System([UnassignCard], [trello]);

// TODO: Package this duplicate code as well
function mock_message(message: string, author = "Author") {
  const users = message.match(/(?<=<@!)[^>]+(?=>)/g) || [];

  return {
    content: message,
    mentions: {
      users: new Collection<string, User>(
        users.map(user => [user, ({ toString: () => `<@!${user}>`, tag: user }) as User])
      )
    },
    channel: { send: jest.fn(() => Promise.resolve(true)) },
    author: { toString: () => `<@!${author.toLowerCase()}>`, tag: author }
  };
}

describe("unassign command", () => {
  beforeEach(() => {
    trello.set_cards(default_cards.map((card, i) => ({ ...card, assignee: `user${Math.floor(1 + i / 2)}` })));
  });

  it("should work with a single card", async () => {
    const message = mock_message("!unassign Attach", 'user2');
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user2> from Attach");

    const attach_card = trello.cards.find(card => card.name === "Attach");
    if(!attach_card)
      throw new Error();

    expect(attach_card.assignee).toBe("");
  });

  it("should work with a partial card", async () => {
    const message = mock_message("!unassign Prep", 'user2');
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user2> from Prepare");

    const card = trello.cards.find(card => card.name === "Prepare");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("");
  });

  it("should notice ambiguous cards", async () => {
    const message = mock_message("!unassign Card");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith('Name "Card" too ambiguous, 2 matches found: Card 1, Card 2');

    const card = trello.cards.find(card => card.name === "Card 1");
    if(!card)
      throw new Error();
  });

  it("should fail when no matches", async () => {
    const message = mock_message("!unassign Chestnut");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith('Card "Chestnut" not found');
  });

  it("should be able to deal with a list", async () => {
    const message = mock_message("!unassign 'Card 2', 'Card 1'", "user1");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user1> from Card 2, Card 1");

    const a_card = trello.cards.find(card => card.name === "Card 2");
    const b_card = trello.cards.find(card => card.name === "Card 1");
    if(!a_card || !b_card)
      throw new Error();

    expect(a_card.assignee).toBe("");
    expect(b_card.assignee).toBe("");
  });

  it("should be able to unassign from other users", async () => {
    const message = mock_message("!unassign <@!user2> from Prepare");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user2> from Prepare");

    const card = trello.cards.find(card => card.name === "Prepare");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("");
  });

  it("should not unassign another users card", async () => {
    const message = mock_message("!unassign Prepare");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("The card 'Prepare' is not assigned to <@!author>");

    const card = trello.cards.find(card => card.name === "Prepare");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("user2");
  });
});
