import "jest";
import { Message, Collection, User } from "discord.js";

import System from "../core/system";
import Trello, { default_cards } from "../integrations/__mocks__/trello";
import UnassignCard from "./unassign";

const assigned_cards = default_cards.map((card, i) => ({ ...card, assignee: `user-${Math.ceil(1 + i / 2)}` }))

const trello = new Trello(assigned_cards);
const system = new System([UnassignCard], [trello]);

// TODO: Package this duplicate code as well
function mock_message(message: string, author: string = "Author") {
  const users = message.match(/(?<=<@!)[^>]+(?=>)/g) || [];

  return {
    content: message,
    mentions: {
      users: new Collection<string, User>(
        users.map(user => [user, ({ toString: () => `<@!${user}>`, tag: `User ${user}` }) as User])
      )
    },
    channel: { send: jest.fn(() => Promise.resolve(true)) },
    author: { toString: () => `<@!${author.toLowerCase()}>`, tag: author }
  };
}

describe("unassign command", () => {
  beforeEach(() => {
    trello.cards.forEach(card => card.assignee = undefined);
  });

  it("should work with a single card", async () => {
    const message = mock_message("!unassign Attach", 'user-2');
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user-2> from Attach");

    const attach_card = trello.cards.find(card => card.name === "Attach");
    if(!attach_card)
      throw new Error();

    expect(attach_card.assignee).toBe("");
  });

  it("should work with a partial card", async () => {
    const message = mock_message("!unassign Prep", 'user-2');
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user-2> from Prepare");

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

    expect(card.assignee).toBe(undefined);
  });

  it("should fail when no matches", async () => {
    const message = mock_message("!unassign Chestnut");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith('Card "Chestnut" not found');
  });

  it("should be able to deal with a list", async () => {
    const message = mock_message("!unassign Attach, 'Card 1'");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!author> from Attach, Card 1");

    const attach_card = trello.cards.find(card => card.name === "Attach");
    const other_card = trello.cards.find(card => card.name === "Card 1");
    if(!attach_card || !other_card)
      throw new Error();

    expect(attach_card.assignee).toBe("");
    expect(other_card.assignee).toBe("");
  });

  it("should be able to unassign from other users", async () => {
    const message = mock_message("!unassign <@!user> from Prepare");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!user> from Prepare");

    const card = trello.cards.find(card => card.name === "Prepare");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("User user");
  });

  it("should be able to take exact matches in ambiguous cases", async () => {
    trello.set_cards([...trello.cards, { name: "Ambiguo", id: '11' }, { name: "Ambiguous", id: '10' }]);

    const message = mock_message("!unassign Ambiguo");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!author> from Ambiguo");

    const card = trello.cards.find(card => card.name === "Ambiguo");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("");
  });

  it("should be able to unassign a single, multi-word card", async () => {
    trello.set_cards([...trello.cards, { name: "Multi word card", id: '11' }]);

    const message = mock_message("!unassign Multi word");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Unassigned <@!author> from Multi word card");
  });
});
