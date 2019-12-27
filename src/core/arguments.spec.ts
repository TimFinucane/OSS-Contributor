import "jest";
import { Message, Collection, User } from "discord.js";

import { ArgumentParser, ArgumentParsingException } from "./arguments";

function mock_message(content: string): Message {
  const user_matches = content.match(/(?<=<@!)\d+(?=>)/g);

  let users;
  if(user_matches) {
    users = new Collection<string, User>(
      user_matches.map(match => [match, { tag: `User ${match}`, id: match, toString: () => `<@!${match}>` } as User])
    );
  }
  else
    users = [];

  return {
    content,
    mentions: { users },
  } as any;
}

describe("argument parser", () => {
  it("should successfully parse 2 simple arguments", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any'
      }
    ]);

    const message = mock_message('Hello World');

    const result = parser.parse(message);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Hello');
    expect(result[1]).toBe('World');
  });

  it("should gracefully fail when there are not enough arguments", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any'
      },
      {
        type: 'any'
      }
    ]);

    const message = mock_message('Hello World');

    try {
      parser.parse(message);
      fail("Never threw exception");
    }
    catch(e) {
      // Done this way for the typescript autocompletes
      if(!(e instanceof ArgumentParsingException)) {
        fail("Expected error to be an ArgumentParsingException");
        return;
      }

      // TODO: Should be changed to 'not enough args'
      expect(e.message).toBe('Unable to get match for argument [2] from string \"\"');
    }
  });

  it("should capture end text into last variable when there is too much text", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any'
      }
    ]);

    const message = mock_message('Hello World World');

    const result = parser.parse(message);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Hello');
    expect(result[1]).toBe('World World');
  });

  it("should capture end text into last array element when there are no further arguments", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any',
        is_array: true,
      }
    ]);

    const result = parser.parse(mock_message('Hello World Hello World'));

    expect(result).toHaveLength(2);
    expect((result[1] as string[])[0]).toBe('World Hello World');
  });

  it("should capture multiple words when there are commas and no further arguments", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any',
        is_array: true,
      },
    ]);

    const result = parser.parse(mock_message('Hello all in one, all second, third last'));

    expect(result).toHaveLength(2);
    expect((result[1] as string[])).toEqual(['all in one', 'all second', 'third last']);
  });

  it("should gracefully fail when unable to add excess text to last variable", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any'
      },
    ]);

    const message = mock_message('Hello "World" world');

    try {
      parser.parse(message);
      fail("Never threw exception");
    }
    catch(e) {
      // Done this way for the typescript autocompletes
      if(!(e instanceof ArgumentParsingException)) {
        fail("Expected error to be an ArgumentParsingException");
        return;
      }

      // TODO: Should be changed to 'not enough args'
      expect(e.message).toBe('Whole message was not parseable. "world" could not be put into an argument');
    }
  });

  it("should capture multiple words when in quotes", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any'
      }
    ]);

    const message_1 = mock_message('Hello "to you, World"');
    const message_2 = mock_message("'Hello to you,' World");

    const result_1 = parser.parse(message_1);

    expect(result_1).toHaveLength(2);
    expect(result_1[1]).toBe('to you, World');

    const result_2 = parser.parse(message_2);

    expect(result_2).toHaveLength(2);
    expect(result_2[0]).toBe('Hello to you,');
  });

  it("should be able to capture a user", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any'
      }
    ]);

    const message = mock_message('Hello <@!1>');

    const result = parser.parse(message);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Hello');
    expect(typeof result[1]).toBe('object');
    expect((result[1] as User).tag).toBe('User 1');
  });

  it("should reject a string when a user was requested", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'user'
      }
    ]);

    const message = mock_message('Hello world');

    try {
      parser.parse(message);
      fail("Did not throw error");
    }
    catch(e) {
      // Done this way for the typescript autocompletes
      if(!(e instanceof ArgumentParsingException)) {
        fail("Expected error to be an ArgumentParsingException");
        return;
      }

      // TODO: Should update this error message
      expect(e.message).toBe('Found argument "world" of wrong type (expected user)');
    }
  });
  it("should reject a user when a string was requested", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'string'
      }
    ]);

    const message = mock_message('Hello <@!1>');

    try {
      parser.parse(message);
      fail("Did not throw error");
    }
    catch(e) {
      // Done this way for the typescript autocompletes
      if(!(e instanceof ArgumentParsingException)) {
        fail("Expected error to be an ArgumentParsingException");
        return;
      }

      expect(e.message).toBe('Found argument "<@!1>" of wrong type (expected string)');
    }
  });

  it("should recognise and require suffixes", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any',
        suffix: ' the'
      },
      {
        type: 'any'
      }
    ]);

    const message = mock_message('Hello to the World');

    const result = parser.parse(message);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Hello');
    expect(result[1]).toBe('to');
    expect(result[2]).toBe('World');
  });

  it("should be able to capture an array", () => {
    const parser = new ArgumentParser([
      {
        type: 'any',
        is_array: true,
      },
      {
        type: 'any',
      }
    ]);

    const message = {
      content: 'Hello, World! Wassup',
      mentions: { users: [] },
    } as any as Message;

    const result = parser.parse(message);

    expect(result).toHaveLength(2);

    const varr = result[0] as string[];
    expect(typeof varr).toBe('object');
    expect(varr).toHaveLength(2);
    expect(varr[0]).toBe('Hello');
    expect(varr[1]).toBe('World!');

    expect(result[1]).toBe('Wassup');
  });

  it("should be able to capture quoted strings within arrays", () => {
    const parser = new ArgumentParser([
      {
        type: 'any',
      },
      {
        type: 'any',
        is_array: true
      }
    ]);

    const message = {
      content: 'Value A, "B, C, and D", E',
      mentions: { users: [] },
    } as any as Message;

    const result = parser.parse(message);

    expect(result).toHaveLength(2);

    const arr = result[1] as string[];
    expect(typeof arr).toBe('object');
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe('A');
    expect(arr[1]).toBe('B, C, and D');
    expect(arr[2]).toBe('E');
  });

  it("should skip optional arguments when it can't fill them", () => {
    const parser = new ArgumentParser([
      {
        type: 'any'
      },
      {
        type: 'any',
        optional: true
      }
    ]);

    const message = mock_message('Hello');

    const result = parser.parse(message);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Hello');
  });

  it("should drop optional arguments when a suffix is missing", () => {
    const parser = new ArgumentParser([
      {
        type: 'any',
        optional: true,
        suffix: 'to'
      },
      {
        type: 'any',
      }
    ]);

    const message = mock_message('Hello World!');

    const result = parser.parse(message);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(undefined);
    expect(result[1]).toBe('Hello World!');
  });

  it("should capture optional arguments when it can", () => {
    const parser = new ArgumentParser([
      {
        type: 'any',
        optional: true
      },
      {
        type: 'any',
      }
    ]);

    const message = mock_message('Hello World!');
    const result = parser.parse(message);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Hello');
    expect(result[1]).toBe('World!');
  });
});
