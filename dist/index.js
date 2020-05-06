"use strict";
// https://npmjs.com/package/discord-command-parser
// https://github.com/campbellbrendene/discord-command-parser
// Licensed under the MIT license. See "LICENSE" in the root of this project.
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = "1.4.0";
function getArguments(body) {
    var args = [];
    var str = body.trim();
    while (str.length) {
        var arg = void 0;
        if (str.startsWith('"') && str.indexOf('"', 1) > 0) {
            arg = str.slice(1, str.indexOf('"', 1));
            str = str.slice(str.indexOf('"', 1) + 1);
        }
        else if (str.startsWith("'") && str.indexOf("'", 1) > 0) {
            arg = str.slice(1, str.indexOf("'", 1));
            str = str.slice(str.indexOf("'", 1) + 1);
        }
        else if (str.startsWith("```") && str.indexOf("```", 3) > 0) {
            arg = str.slice(3, str.indexOf("```", 3));
            str = str.slice(str.indexOf("```", 3) + 3);
        }
        else {
            arg = str.split(/\s+/g)[0].trim();
            str = str.slice(arg.length);
        }
        args.push(arg.trim());
        str = str.trim();
    }
    return args;
}
var MessageArgumentReader = /** @class */ (function () {
    function MessageArgumentReader(args, body) {
        this.args = args.slice();
        this.body = body;
        this._index = 0;
    }
    /** Returns the next argument (or null if exhausted) and advances the index (unless `peek` is `true`). */
    MessageArgumentReader.prototype.getString = function (peek) {
        if (peek === void 0) { peek = false; }
        if (this._index >= this.args.length)
            return null;
        return this.args[peek ? this._index : this._index++];
    };
    /** Gets all the remaining text and advances the index to the end (unless `peek` is `true`). */
    MessageArgumentReader.prototype.getRemaining = function (peek) {
        if (peek === void 0) { peek = false; }
        if (this._index >= this.args.length)
            return null;
        var remaining = this.body.trim();
        for (var i = 0; i < this._index; i++) {
            if (remaining.startsWith('"') && remaining.charAt(this.args[i].length + 1) === '"') {
                remaining = remaining.slice(this.args[i].length + 2).trim();
            }
            else if (remaining.startsWith("'") && remaining.charAt(this.args[i].length + 1) === "'") {
                remaining = remaining.slice(this.args[i].length + 2).trim();
            }
            else if (remaining.startsWith("```") && remaining.slice(this.args[i].length + 3).startsWith("```")) {
                remaining = remaining.slice(this.args[i].length + 6).trim();
            }
            else {
                remaining = remaining.slice(this.args[i].length).trim();
            }
        }
        if (!peek)
            this.seek(Infinity);
        return remaining;
    };
    /** Advances the index (unless `peek` is `true`) and tries to parse a valid user ID or mention and returns the ID, if found. */
    MessageArgumentReader.prototype.getUserID = function (peek) {
        if (peek === void 0) { peek = false; }
        var str = this.getString(peek);
        if (str === null)
            return null;
        if (/^\d{17,19}$/.test(str))
            return str;
        var match = str.match(/^\<@!?(\d{17,19})\>$/);
        if (match && match[1])
            return match[1];
        return null;
    };
    /** Advances the index (unless `peek` is `true`) and tries to parse a valid channel ID or mention and returns the ID, if found. */
    MessageArgumentReader.prototype.getChannelID = function (peek) {
        if (peek === void 0) { peek = false; }
        var str = this.getString(peek);
        if (str === null)
            return null;
        if (/^\d{17,19}$/.test(str))
            return str;
        var match = str.match(/^\<#(\d{17,19})\>$/);
        if (match && match[1])
            return match[1];
        return null;
    };
    /** Safely increments or decrements the index. Use this for skipping arguments. */
    MessageArgumentReader.prototype.seek = function (amount) {
        if (amount === void 0) { amount = 1; }
        this._index += amount;
        if (this._index < 0)
            this._index = 0;
        if (this._index > this.args.length)
            this._index = this.args.length;
        return this;
    };
    return MessageArgumentReader;
}());
exports.MessageArgumentReader = MessageArgumentReader;
function parse(message, prefix, options) {
    if (options === void 0) { options = {}; }
    var _a, _b;
    function fail(error) {
        return { success: false, error: error, message: message };
    }
    var prefixes = Array.isArray(prefix) ? __spreadArrays(prefix) : [prefix];
    if (message.author.bot && !options.allowBots)
        return fail("Message sent by a bot account");
    if (message.author.id === ((_a = message.client.user) === null || _a === void 0 ? void 0 : _a.id) && !options.allowSelf)
        return fail("Message sent from client's account");
    if (!message.content)
        return fail("Message body empty");
    var matchedPrefix = null;
    for (var _i = 0, prefixes_1 = prefixes; _i < prefixes_1.length; _i++) {
        var p = prefixes_1[_i];
        if ((options.ignorePrefixCase && message.content.toLowerCase().startsWith(p.toLowerCase())) ||
            message.content.startsWith(p)) {
            matchedPrefix = p;
            break;
        }
    }
    if (!matchedPrefix)
        return fail("Message does not start with prefix");
    var remaining = message.content.slice(matchedPrefix.length);
    if (!remaining)
        return fail("No body after prefix");
    if (!options.allowSpaceBeforeCommand && /^\s/.test(remaining))
        return fail("Space before command name");
    remaining = remaining.trim();
    var command = (_b = remaining.match(/^[^\s]+/i)) === null || _b === void 0 ? void 0 : _b[0];
    if (!command)
        return fail("Could not match a command");
    remaining = remaining.slice(command.length).trim();
    var args = getArguments(remaining);
    return {
        success: true,
        message: message,
        prefix: matchedPrefix,
        arguments: args,
        reader: new MessageArgumentReader(args, remaining),
        body: remaining,
        command: command,
    };
}
exports.parse = parse;
//# sourceMappingURL=index.js.map