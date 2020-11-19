# discord-command-parser

Basic parsing for messages received with [discord.js](https://github.com/discordjs/discord.js) OR [eris](https://github.com/abalabahaha/eris).

[![npm](https://img.shields.io/npm/dt/discord-command-parser.svg?style=for-the-badge)](https://npmjs.com/package/discord-command-parser)
[![npm](https://img.shields.io/npm/v/discord-command-parser.svg?style=for-the-badge)](https://npmjs.com/package/discord-command-parser)

## Installation

```shell
$ yarn add discord-command-parser
```

or, with NPM

```shell
$ npm i discord-command-parser
```

## Examples

Discord.js

```typescript
import { parse } from "discord-command-parser";

bot.on("message", async (message) => {
  const parsed = parse(message, "!", { allowSpaceBeforeCommand: true });
  if (!parsed.success) return;
  if (parsed.command === "ping") return message.reply("Pong!");
});
```

Eris

```typescript
import { parse } from "discord-command-parser";

bot.on("messageCreate", async (message) => {
  const parsed = parse(message, "!", { allowSpaceBeforeCommand: true });
  if (!parsed.success) return;
  if (parsed.command === "ping") return bot.createMessage(message.channelID, "Pong!");
});
```

## Usage

---

### `parse(message, prefix [, options]): ParsedMessage`

Parses a message for commands. `prefix` may be a string or an array of strings
for command prefixes that the command must start with.

By default, this function checks to make sure that the message author is not a bot account. This can be overridden by setting `options.allowBots` to false.

#### `options`

- `allowBots: boolean = false` - By default, this function checks to make sure
  that the message author is not a bot account. Setting this to `true` will disable
  this check.
- `allowSpaceBeforeCommand: boolean = false` - Set this to `true` if you want the parser to be more forgiving of command prefixes (e.g. allowing "`! ping`" to work as well as "`!ping`" when the prefix is "`!`").
- `ignorePrefixCase: boolean = false` - If `true`, "`A!ping`" will behave the
  same as "`a!ping`". The bot will ignore the case of the prefix when checking for
  a match.

---

### `ParsedMessage`

Represents the result of message parsing. This can be represent either a
success or failure state. Check the `success` property to determine.

#### Common properties (success/failure)

- `success: boolean` - Whether the parsing succeeded and the message appears to be
  a valid command. Always remember to check this.
- `error: string | undefined` - On failure, this will detail which check failed
  for debugging purposes.
- `message: Message` - The message that was parsed.

> **Note:** In the event of a failure, only the `success`, `error`, and `message` properties are defined.

#### Successful-only properties

- `prefix: string` - The prefix that the command starts with. Useful when using an array of prefixes.
- `command: string` - The command name that was parsed from the message
  (e.g. `"ping"` for a message of "`!ping`").
- `arguments: string[]` - The arguments (whitespace-delimited) that were passed
  after the command name. This also processes quoted parameters to allow for
  whitespace inside arguments (e.g. `["hello", "foo bar"]` for the message
  "`!say hello "foo bar"`").

  Valid quote types are single (`'`), double (`"`), and codeblock (<code>```</code>).

  Note that Inline code (<code>`</code>) is not supported.

- `body: string` - The body of the message immediately following the command name (e.g. `"hello world"` for the message "`!say hello world`").
- `reader: MessageArgumentReader` - The `MessageArgumentReader` instance for this
  command. See the `MessageArgumentReader` section below.

> **TypeScript Note:** a `ParsedMessage` can represent either an invalid result
> (`FailedParsedMessage`) or a successful result (`SuccessfulParsedMessage`). The
> result of `parse()` should be picked up by TypeScript just by checking the
> `parsed.success` value.
>
> Additionally, the `ParsedMessage` classes are generic. Pass the discord.js or eris
> `Message` type to the generic field (e.g. `ParsedMessage<Message>`).
>
> If you are using a library other than discord.js or eris, ensure that the Message type
> you use adheres to the `BasicMessage` interface in the source code.

---

### `MessageArgumentReader`

An object-oriented way of sequentially parsing and checking arguments and is usually preferable over the `ParsedMessage.arguments` array.

For all "get" methods, the `peek` parameter will not advance to the next argument
and will just return the current argument.

A `Validator<T>` is an optional function which accepts a parameter of type `T` and returns a boolean indicative of whether the value is valid.
If a `Validator` returns `false`, then the invoking `get___` function will return `null`.

#### `getString(peek: boolean = false, v?: Validator<string>): string | null`

Returns the next argument (or null if exhausted)

#### `getInt(peek: boolean = false, v?: Validator<number>): number | null`

Returns the next (safe) integer (or null if exhausted)

#### `getFloat(peek: boolean = false, v?: Validator<number>): number | null`

Returns the next (safe down to 2 decimal places) float (or null if exhausted)

#### `getRemaining(peek: boolean = false, v?: Validator<string>): string | null`

Gets all the remaining text. This advances the index to the end unless
`peek` is `true`.

#### `getUserID(peek: boolean = false, v?: Validator<string>): string | null`

Advances the index (unless `peek` is `true`), and **then** tries to
parse a valid user ID or user mention and returns the ID, if found,
otherwise null.

#### `getRoleID(peek: boolean = false, v?: Validator<string>): string | null`

Similar to `getUserID`, but using role mention format (`<@&123...>`).

#### `getChannelID(peek: boolean = false, v?: Validator<string>): string | null`

Similar to `getUserID`, but using channel mention format (`<#123...>`).

#### `seek(amount: number = 1): this`

Safely increments or decrements the index. Useful for skipping arguments.

---

## Contributing

If you wish to submit a PR with new or fixed feautres, make sure to
create/modify test cases in `tests/index.js` and ensure that `npm test`
works.

Please adhere to the code style that is managed by [Prettier](https://prettier.io/).
If you use Visual Studio Code, you can install the [Prettier extenstion](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

## Examples (TypeScript)

Basic usage:

```typescript
import { parse } from "discord-command-parser";
import { Client, Message } from "discord.js";

const bot = new Client();

bot.on("message", async (message) => {
  const parsed = parse(message, "!", {
    allowSpaceBeforeCommand: true,
  });

  if (!parsed.success) return;

  if (message.command === "ping") return message.reply("Pong!");
});

bot.login("token");
```

`MessageArgumentReader` - "send" command

```typescript
// ...
bot.on("message", async (message) => {
  // ...
  if (parsed.command === "send" || parsed.command === "dm") {
    const recipient = parsed.reader.getUserID();
    const content = parsed.reader.getRemaining();

    if (!recipient || !content) {
      return message.reply(`Usage: ${parsed.prefix}${parsed.command} <user> <message>`);
    }

    try {
      const user = await bot.users.fetch(recipient);
    } catch {
      return message.reply("Invalid recipient!");
    }

    try {
      await user.send(content);
    } catch {
      return message.reply("Could not DM user.");
    }

    return;
  }
});
// ...
```

## License

This program is licensed under the **MIT License**. See the `LICENSE` file
in the root of the project or https://opensource.org/licenses/MIT for more
info.

Copyright &copy; 2020 Brenden Campbell.
