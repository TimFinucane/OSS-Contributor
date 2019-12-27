import "jest";
import { Message, Collection, User } from "discord.js";

import System from "../core/system";
import Trello from "../integrations/__mocks__/trello";
import AssignCard from "./assign";

const trello = new Trello();
const system = new System([AssignCard], [trello]);

function mock_message(message: string) {
  const users = message.match(/(?<=<@!)[^>]+(?=>)/g) || [];

  return {
    content: message,
    mentions: {
      users: new Collection<string, User>(
        users.map(user => [user, ({ toString: () => `<@!${user}>`, tag: `User ${user}` }) as User])
      )
    },
    channel: { send: jest.fn(() => Promise.resolve(true)) },
    author: { toString: () => "<@!author>", tag: "Author" }
  };
}

describe("assign command", () => {
  beforeEach(() => {
    trello.cards.forEach(card => card.assignee = undefined);
  });

  it("should work with a single card", async () => {
    const message = mock_message("!assign Attach");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Assigned <@!author> to Attach");

    const attach_card = trello.cards.find(card => card.name === "Attach");
    if(!attach_card)
      throw new Error();

    expect(attach_card.assignee).toBe("Author");
  });

  it("should work with a partial card", async () => {
    const message = mock_message("!assign Prep");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Assigned <@!author> to Prepare");

    const card = trello.cards.find(card => card.name === "Prepare");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("Author");
  });

  it("should notice ambiguous cards", async () => {
    const message = mock_message("!assign Card");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith('Name "Card" too ambiguous, 2 matches found: Card 1, Card 2');

    const card = trello.cards.find(card => card.name === "Card 1");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe(undefined);
  });

  it("should fail when no matches", async () => {
    const message = mock_message("!assign Chestnut");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith('Card "Chestnut" not found');
  });

  it("should be able to deal with a list", async () => {
    const message = mock_message("!assign Attach, 'Card 1'");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Assigned <@!author> to Attach, Card 1");

    const attach_card = trello.cards.find(card => card.name === "Attach");
    const other_card = trello.cards.find(card => card.name === "Card 1");
    if(!attach_card || !other_card)
      throw new Error();

    expect(attach_card.assignee).toBe("Author");
    expect(other_card.assignee).toBe("Author");
  });

  it("should be able to assign to other users", async () => {
    const message = mock_message("!assign <@!user> to Prepare");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Assigned <@!user> to Prepare");

    const card = trello.cards.find(card => card.name === "Prepare");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("User user");
  });

  it("should be able to take exact matches in ambiguous cases", async () => {
    trello.set_cards([...trello.cards, { name: "Ambiguo", id: '11' }, { name: "Ambiguous", id: '10' }]);

    const message = mock_message("!assign Ambiguo");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Assigned <@!author> to Ambiguo");

    const card = trello.cards.find(card => card.name === "Ambiguo");
    if(!card)
      throw new Error();

    expect(card.assignee).toBe("Author");
  });

  it("should be able to assign a single, multi-word card", async () => {
    trello.set_cards([...trello.cards, { name: "Multi word card", id: '11' }]);

    const message = mock_message("!assign Multi word");
    await system.on_message(message as any as Message);

    expect(message.channel.send).toBeCalledWith("Assigned <@!author> to Multi word card");
  });
});
