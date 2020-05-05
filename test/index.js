// This file tests discord-command-parser against a few pseudo-real-life messages

class Message {
  constructor(content, is_bot = false, is_self = false) {
    this.content = content;
    this.author = {
      bot: is_bot,
      id: is_self ? "0001" : "0002",
    };
    this.client = {
      user: {
        id: "0001",
      },
    };
  }
}

const { parse } = require("../dist/index.js");
const chalk = require("chalk");

const tests = {
  "Ignore messages sent by bots": () => {
    return parse(new Message("!ping", true), "!").success === false;
  },
  "Ignore messages sent by self": () => {
    return parse(new Message("!ping", false, true), "!").success === false;
  },
  "Explicit allow bots": () => {
    return parse(new Message("!ping", true), "!", { allowBots: true }).success === true;
  },
  "Explicit allow self": () => {
    return parse(new Message("!ping", false, true), "!", { allowSelf: true }).success === true;
  },
  "No-arg commands": () => {
    return parse(new Message("!ping"), "!").command === "ping";
  },
  "Arg commands": () => {
    return parse(new Message("!ping aa bb"), "!").arguments.join(",") === "aa,bb";
  },
  "Success on no-arg": () => {
    return parse(new Message("!ping"), "!").success === true;
  },
  "Fail on just prefix": () => {
    return parse(new Message("!"), "!").success === false;
  },
  "Fail on wrong prefix": () => {
    return parse(new Message("%ping me"), "!").success === false;
  },
  "Fail on empty body": () => {
    return parse(new Message(""), "!").success === false;
  },
  "Fail on space after prefix": () => {
    return parse(new Message("! ping"), "!").success === false;
  },
  "Explicit allow space after prefix": () => {
    const parsed = parse(new Message("! ping"), "!", { allowSpaceBeforeCommand: true });
    return parsed.success === true && parsed.command === "ping";
  },
  "Explicit prefix ignore case": () => {
    const parsed = parse(new Message("A!ping"), "a!", { ignorePrefixCase: true });
    return parsed.success === true && parsed.prefix === "a!";
  },
  "Get correct command": () => {
    return parse(new Message("!PiNg"), "!").command === "PiNg";
  },
  "Doublequote args": () => {
    return parse(new Message('!say "hello world"'), "!").arguments.join(",") === "hello world";
  },
  "Singlequote args": () => {
    return parse(new Message("!say 'hello world'"), "!").arguments.join(",") === "hello world";
  },
  "Codeblock args": () => {
    return parse(new Message("!say ```\nhello world```"), "!").arguments.join(",") === "hello world";
  },
  "Success prefix[0]": () => {
    return parse(new Message("!ping"), ["!", "?"]).success === true;
  },
  "Match prefix[0]": () => {
    return parse(new Message("!ping"), ["!", "?"]).prefix === "!";
  },
  "Success prefix[1]": () => {
    return parse(new Message("?ping"), ["!", "?"]).success === true;
  },
  "Match prefix[1]": () => {
    return parse(new Message("?ping"), ["!", "?"]).prefix === "?";
  },
  "No match on []": () => {
    return parse(new Message("!ping"), []).success === false;
  },
  "No match on [...]": () => {
    return parse(new Message("!ping"), ["!!", "!!!"]).success === false;
  },
  // Reader
  "Reader getString": () => {
    const parsed = parse(new Message("!ping aa 'bb cc' \"dd ee ff\""), "!");
    if (!parsed.success) return false;
    return (
      parsed.reader.getString() === "aa" &&
      parsed.reader.getString() === "bb cc" &&
      parsed.reader.getString() === "dd ee ff"
    );
  },
  "Reader getUserID": () => {
    const parsed = parse(new Message("!ping <@000000000000000000> <@!0000000000000000000>"), "!");
    if (!parsed.success) return false;
    return parsed.reader.getUserID() === "000000000000000000" && parsed.reader.getUserID() === "0000000000000000000";
  },
  "Reader getChannelID": () => {
    const parsed = parse(new Message("!ping <#000000000000000000>"), "!");
    if (!parsed.success) return false;
    return parsed.reader.getChannelID() === "000000000000000000";
  },
  "Reader getRemaining": () => {
    const after = "abc 123  rFjnj6UEdWU8yznA7 !&*PH   ALVW\t% 1Ydh^j96\n\n\r\nmj dqx   9QjPVZ";
    const parsed = parse(new Message(`!ping test ${after}`), "!");
    if (!parsed.success) return false;
    return parsed.reader.getString() === "test" && parsed.reader.getRemaining() === after;
  },
  "Reader getRemaining after quoted arguments": () => {
    const after = "abc 123  rFjnj6UEdWU8yznA7 !&*PH   ALVW\t% 1Ydh^j96\n\n\r\nmj dqx   9QjPVZ";
    const parsed = parse(new Message(`!ping test "lorem ipsum"  "dolor sit amet"     ${after}`), "!");
    if (!parsed.success) return false;
    return (
      parsed.reader.getString() === "test" &&
      parsed.reader.getString() === "lorem ipsum" &&
      parsed.reader.getString() === "dolor sit amet" &&
      parsed.reader.getRemaining() === after
    );
  },
  "Reader getRemaining after blockquote arguments": () => {
    const after = "abc 123  rFjnj6UEdWU8yznA7 !&*PH   ALVW\t% 1Ydh^j96\n\n\r\nmj dqx   9QjPVZ";
    const parsed = parse(
      new Message(`!ping test "lorem ipsum" \`\`\`this is a test\`\`\`  "dolor sit amet"     ${after}`),
      "!"
    );
    if (!parsed.success) return false;
    return (
      parsed.reader.getString() === "test" &&
      parsed.reader.getString() === "lorem ipsum" &&
      parsed.reader.getString() === "this is a test" &&
      parsed.reader.getString() === "dolor sit amet" &&
      parsed.reader.getRemaining() === after
    );
  },
};

let passed_sum = 0;
let failed_sum = 0;

for (let test in tests) {
  if (tests[test]()) {
    passed_sum++;
    console.log(chalk.greenBright(`[PASSED] \t${test}`));
  } else {
    failed_sum++;
    console.log(chalk.redBright(`[FAILED] \t${test}`));
  }
}
const pct_passed = Math.floor((passed_sum / (passed_sum + failed_sum)) * 100);

console.log(
  `${pct_passed === 100 ? chalk.greenBright(pct_passed + "% PASSED") : chalk.yellowBright(pct_passed + "% PASSED")}`
);
if (pct_passed !== 100) process.exit(1);
