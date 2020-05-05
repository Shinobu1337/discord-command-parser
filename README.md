# discord-command-parser

Basic parsing for messages received with [Discord.js](https://github.com/discordjs/discord.js).

[![npm](https://img.shields.io/npm/dt/discord-command-parser.svg?style=for-the-badge)](https://npmjs.com/package/discord-command-parser)
[![npm](https://img.shields.io/npm/v/discord-command-parser.svg?style=for-the-badge)](https://npmjs.com/package/discord-command-parser)

# Installation

With npm:

```shell
$ npm install --save discord-command-parser
```

With Yarn:

```shell
$ yarn add discord-command-parser
```

# Quick Example

```js
const discord = require("discord.js");
const parser = require("discord-command-parser");

const prefix = "?";
const client = new discord.Client();

client.on("message", (message) => {
  const parsed = parser.parse(message, prefix);
  if (!parsed.success) return;

  if (parsed.command === "ping") {
    return message.reply("Pong!");
  }
});

client.login("Token").then(() => console.log("Ready!"));
```

---

_This project is written using [TypeScript](http://typescriptlang.org/). If you use a compatible
IDE, you should get documentation, autocompletion, and error-checking included when you use this
library._

# Documentation

## **See [the source code](src/index.ts) for more details and comments.**

## `parse(message, prefix, [options])`

> Returns a `ParsedMessage`.

- `message` **_Message_**; the Discord.js Message to parse.
- `prefix` **_string | string[]_**; the prefix(es) to check for in commands.
- `options` **_object, optional_**; additional configuration.
  - `options.allowBots` **_boolean_**; whether to parse messages sent by bot accounts (`message.author.bot`).
  - `options.allowSelf` **_boolean_**; whether to parse messages sent by the client account.
  - `options.allowSpaceBeforeCommand` **_boolean_**; whether to allow a space (or multiple) between the prefix and the command name.
  - `options.ignorePrefixCase` **_boolean_**; whether to ignore the case of the prefix used. Note that the prefix returned in the `ParsedMessage` will be set to the matching element in the prefix argument, not the prefix in the message, in the event of mismatching case.

## `ParsedMessage`

Used internally and returned by `parse`.

Note: if `suceess` is `false`, only `success`, `error`, and `message` are defined.

### Properties:

- `success`: **_boolean_**
  > Whether the message could be parsed and appears to be a valid command.
- `prefix`: **_string_**
  > The prefix that matched. Useful when providing an array of prefixes to `parse`.
- `command`: **_string_**
  > The command that was parsed from the message. For example, the message `!ping` would have a `command` value of `ping`.
- `arguments`: **_string[]_**
  > **Consider using `reader` for a more advanced way of getting arguments.**
  >
  > An array of whitespace or quote delimited arguments that were passed to the command. For example, the command
  >
  > ```
  > !ban Clyde 7d "repeated spam of \"no u\" after warning"
  > ```
  >
  > would have an `arguments` value of:
  >
  > ```js
  > ["Clyde", "7d", 'repeated spam of "no u" after warning'];
  > ```
- `reader`: **MessageArgumentReader**
  > Use the `getString()`, `getUserID()`, `getChannelID()` and `getRemaining()`
  > methods to get command arguments in a more object-oriented fashion. All
  > methods return `null` when the argument array is exhausted.
- `error`: **_string_**
  > If `success` is `false`, a description of why the message was rejected. Otherwise empty.
- `body`: **_string_**
  > The unparsed body of the message immediately following the `command`.
- `message`: **_Message_**
  > Redundant to the message that was passed to `parse`.

---

# Example Result

Suppose we got this message on Discord:

```
?remindme "collect daily reward" 24h urgent
```

(Assuming our `prefix` is `"?"`)

This is our resulting `ParsedMessage`:

```js
{
  "success": true,
  "prefix": "?",
  "command": "remindme",
  "arguments": [
    "collect daily reward",
    "24h",
    "urgent"
  ],
  "error": "",
  "code": 0,
  "body": "\"collect daily reward \" 24h urgent",
  "reader": [Object: MessageArgumentReader]
}
```
