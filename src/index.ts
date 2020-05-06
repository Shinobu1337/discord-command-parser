// https://npmjs.com/package/discord-command-parser
// https://github.com/campbellbrendene/discord-command-parser
// Licensed under the MIT license. See "LICENSE" in the root of this project.

export const version = "1.4.0";

/**
 * The base message type with all the properties needed by the library.
 */
export interface BasicMessage {
  content: string;
  author: {
    bot: boolean;
    id: string;
  };
  client: {
    user: {
      id: string;
    } | null;
  };
}

export interface SuccessfulParsedMessage<T extends BasicMessage> {
  readonly success: true;
  /** The prefix that the user provided. */
  readonly prefix: string;
  /** The name of the command issued. */
  readonly command: string;
  /** Everything after the command name. */
  readonly body: string;
  /** An array of command arguments. You might also consider using `reader`. */
  readonly arguments: string[];
  /** A wrapper around arguments with helper methods such as `getUserID()`. */
  readonly reader: MessageArgumentReader;
  /** The message. */
  readonly message: T;
}

export interface FailedParsedMessage<T extends BasicMessage> {
  readonly success: false;
  /** A description of why the parsing failed. */
  readonly error: string;
  /** The message. */
  readonly message: T;
}

export type ParsedMessage<T extends BasicMessage> = FailedParsedMessage<T> | SuccessfulParsedMessage<T>;

export interface ParserOptions {
  allowBots: boolean;
  allowSelf: boolean;
  allowSpaceBeforeCommand: boolean;
  ignorePrefixCase: boolean;
}

function getArguments(body: string): string[] {
  const args: string[] = [];
  let str = body.trim();

  while (str.length) {
    let arg: string;
    if (str.startsWith('"') && str.indexOf('"', 1) > 0) {
      arg = str.slice(1, str.indexOf('"', 1));
      str = str.slice(str.indexOf('"', 1) + 1);
    } else if (str.startsWith("'") && str.indexOf("'", 1) > 0) {
      arg = str.slice(1, str.indexOf("'", 1));
      str = str.slice(str.indexOf("'", 1) + 1);
    } else if (str.startsWith("```") && str.indexOf("```", 3) > 0) {
      arg = str.slice(3, str.indexOf("```", 3));
      str = str.slice(str.indexOf("```", 3) + 3);
    } else {
      arg = str.split(/\s+/g)[0].trim();
      str = str.slice(arg.length);
    }
    args.push(arg.trim());
    str = str.trim();
  }

  return args;
}

export class MessageArgumentReader {
  args: string[];
  body: string;
  _index: number;

  constructor(args: string[], body: string) {
    this.args = args.slice();
    this.body = body;
    this._index = 0;
  }

  /** Returns the next argument (or null if exhausted) and advances the index (unless `peek` is `true`). */
  getString(peek: boolean = false): string | null {
    if (this._index >= this.args.length) return null;
    return this.args[peek ? this._index : this._index++];
  }

  /** Gets all the remaining text and advances the index to the end (unless `peek` is `true`). */
  getRemaining(peek: boolean = false): string | null {
    if (this._index >= this.args.length) return null;
    let remaining = this.body.trim();
    for (let i = 0; i < this._index; i++) {
      if (remaining.startsWith('"') && remaining.charAt(this.args[i].length + 1) === '"') {
        remaining = remaining.slice(this.args[i].length + 2).trim();
      } else if (remaining.startsWith("'") && remaining.charAt(this.args[i].length + 1) === "'") {
        remaining = remaining.slice(this.args[i].length + 2).trim();
      } else if (remaining.startsWith("```") && remaining.slice(this.args[i].length + 3).startsWith("```")) {
        remaining = remaining.slice(this.args[i].length + 6).trim();
      } else {
        remaining = remaining.slice(this.args[i].length).trim();
      }
    }
    if (!peek) this.seek(Infinity);
    return remaining;
  }

  /** Advances the index (unless `peek` is `true`) and tries to parse a valid user ID or mention and returns the ID, if found. */
  getUserID(peek: boolean = false): string | null {
    const str = this.getString(peek);
    if (str === null) return null;
    if (/^\d{17,19}$/.test(str)) return str;
    const match = str.match(/^\<@!?(\d{17,19})\>$/);
    if (match && match[1]) return match[1];
    return null;
  }

  /** Advances the index (unless `peek` is `true`) and tries to parse a valid channel ID or mention and returns the ID, if found. */
  getChannelID(peek: boolean = false): string | null {
    const str = this.getString(peek);
    if (str === null) return null;
    if (/^\d{17,19}$/.test(str)) return str;
    const match = str.match(/^\<#(\d{17,19})\>$/);
    if (match && match[1]) return match[1];
    return null;
  }

  /** Safely increments or decrements the index. Use this for skipping arguments. */
  seek(amount: number = 1): this {
    this._index += amount;
    if (this._index < 0) this._index = 0;
    if (this._index > this.args.length) this._index = this.args.length;
    return this;
  }
}

export function parse<T extends BasicMessage>(
  message: T,
  prefix: string | string[],
  options: Partial<ParserOptions> = {}
): ParsedMessage<T> {
  function fail(error: string): FailedParsedMessage<T> {
    return { success: false, error, message };
  }
  const prefixes = Array.isArray(prefix) ? [...prefix] : [prefix];

  if (message.author.bot && !options.allowBots) return fail("Message sent by a bot account");
  if (message.author.id === message.client.user?.id && !options.allowSelf)
    return fail("Message sent from client's account");
  if (!message.content) return fail("Message body empty");

  let matchedPrefix: string | null = null;
  for (const p of prefixes) {
    if (
      (options.ignorePrefixCase && message.content.toLowerCase().startsWith(p.toLowerCase())) ||
      message.content.startsWith(p)
    ) {
      matchedPrefix = p;
      break;
    }
  }

  if (!matchedPrefix) return fail("Message does not start with prefix");

  let remaining = message.content.slice(matchedPrefix.length);

  if (!remaining) return fail("No body after prefix");
  if (!options.allowSpaceBeforeCommand && /^\s/.test(remaining)) return fail("Space before command name");

  remaining = remaining.trim();

  const command = remaining.match(/^[^\s]+/i)?.[0];
  if (!command) return fail("Could not match a command");
  remaining = remaining.slice(command.length).trim();

  const args = getArguments(remaining);

  return {
    success: true,
    message,
    prefix: matchedPrefix,
    arguments: args,
    reader: new MessageArgumentReader(args, remaining),
    body: remaining,
    command,
  };
}
