export declare const version = "1.4.0";
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
export declare type ParsedMessage<T extends BasicMessage> = FailedParsedMessage<T> | SuccessfulParsedMessage<T>;
export interface ParserOptions {
    allowBots: boolean;
    allowSelf: boolean;
    allowSpaceBeforeCommand: boolean;
    ignorePrefixCase: boolean;
}
export declare class MessageArgumentReader {
    args: string[];
    body: string;
    _index: number;
    constructor(args: string[], body: string);
    /** Returns the next argument (or null if exhausted) and advances the index (unless `peek` is `true`). */
    getString(peek?: boolean): string | null;
    /** Gets all the remaining text and advances the index to the end (unless `peek` is `true`). */
    getRemaining(peek?: boolean): string | null;
    /** Advances the index (unless `peek` is `true`) and tries to parse a valid user ID or mention and returns the ID, if found. */
    getUserID(peek?: boolean): string | null;
    /** Advances the index (unless `peek` is `true`) and tries to parse a valid channel ID or mention and returns the ID, if found. */
    getChannelID(peek?: boolean): string | null;
    /** Safely increments or decrements the index. Use this for skipping arguments. */
    seek(amount?: number): this;
}
export declare function parse<T extends BasicMessage>(message: T, prefix: string | string[], options?: Partial<ParserOptions>): ParsedMessage<T>;
