import { parse, BasicMessage, version } from "../src/index";

class StubMessage implements BasicMessage {
  content: string;
  author: { bot: boolean };

  constructor(content: string, isBot = false) {
    this.content = content;
    this.author = { bot: isBot };
  }
}

test("Exported version number matches package version", () => {
  const pjson = require("../package.json");
  expect(version).toBe(pjson.version);
});

test("Ignore messages sent by bots", () => {
  const result = parse(new StubMessage("!ping", true), "!");
  expect(result.success).toBe(false);
});

test("Explicit allowBots", () => {
  const result = parse(new StubMessage("!ping", true), "!", { allowBots: true });
  expect(result.success).toBe(true);
});

test("Parse no-arg commands", () => {
  const result = parse(new StubMessage("!ping"), "!");
  expect(result.success && result.command === "ping").toBe(true);
});

test("Parse commands with args", () => {
  const result = parse(new StubMessage("!ping aa bb"), "!");
  expect(result.success && result.arguments.join(",")).toBe("aa,bb");
});

test("Fail on just prefix", () => {
  const result = parse(new StubMessage("!"), "!");
  expect(result.success).toBe(false);
});

test("Fail on wrong prefix", () => {
  const result = parse(new StubMessage("%ping aa bb"), "!");
  expect(result.success).toBe(false);
});

test("Fail on empty body", () => {
  const result = parse(new StubMessage(""), "!");
  expect(result.success).toBe(false);
});

test("Fail on space after prefix", () => {
  const result = parse(new StubMessage("! ping"), "!");
  expect(result.success).toBe(false);
});

test("Explicit allowSpaceBeforeCommand", () => {
  const result = parse(new StubMessage("! ping"), "!", { allowSpaceBeforeCommand: true });
  expect(result.success).toBe(true);
});

test("Explicit ignorePrefixCase", () => {
  const result = parse(new StubMessage("A!ping"), "a!", { ignorePrefixCase: true });
  expect(result.success && result.prefix).toBe("a!");
});

test("Get correct command", () => {
  const result = parse(new StubMessage("!PiNg"), "!");
  expect(result.success && result.command).toBe("PiNg");
});

test("Doublequote args", () => {
  const result = parse(new StubMessage('!say "hello world"'), "!");
  expect(result.success && result.arguments.join(",")).toBe("hello world");
});

test("Singlequote args", () => {
  const result = parse(new StubMessage("!say 'hello world'"), "!");
  expect(result.success && result.arguments.join(",")).toBe("hello world");
});

test("Codeblock args", () => {
  const result = parse(new StubMessage("!say ```\nhello world```"), "!");
  expect(result.success && result.arguments.join(",")).toBe("hello world");
});

test("prefix matching", () => {
  let result = parse(new StubMessage("!ping"), ["!", "?"]);
  expect(result.success && result.prefix).toBe("!");

  result = parse(new StubMessage("?ping"), ["!", "?"]);
  expect(result.success && result.prefix).toBe("?");

  result = parse(new StubMessage("!ping"), ["!!", "!!!"]);
  expect(result.success).toBe(false);
});

test("Reader", () => {
  let result = parse(new StubMessage("!ping <@000000000000000000> <@!0000000000000000000>"), "!");
  expect(result.success && [result.reader.getUserID(), result.reader.getUserID()]).toEqual([
    "000000000000000000",
    "0000000000000000000",
  ]);

  result = parse(new StubMessage("!ping <@&000000000000000000> <@&0000000000000000000>"), "!");
  expect(result.success && [result.reader.getRoleID(), result.reader.getRoleID()]).toEqual([
    "000000000000000000",
    "0000000000000000000",
  ]);

  result = parse(new StubMessage("!ping <#000000000000000000>"), "!");
  expect(result.success && result.reader.getChannelID()).toBe("000000000000000000");

  result = parse(new StubMessage("!test 123.56789 12345678 70368744177663.91"), "!");
  expect(result.success && [result.reader.getFloat(), result.reader.getInt(), result.reader.getFloat()]).toEqual([
    123.56789,
    12345678,
    70368744177663.91,
  ]);

  result = parse(new StubMessage("!test -123.56789 -12345678 -70368744177663.91"), "!");
  expect(result.success && [result.reader.getFloat(), result.reader.getInt(), result.reader.getFloat()]).toEqual([
    -123.56789,
    -12345678,
    -70368744177663.91,
  ]);

  const after = "abc 123  rFjnj6UEdWU8yznA7 !&*PH   ALVW\t% 1Ydh^j96\n\n\r\nmj dqx   9QjPVZ";

  result = parse(new StubMessage(`!ping test ${after}`), "!");
  expect(result.success && [result.reader.getString(), result.reader.getRemaining()]).toEqual(["test", after]);

  result = parse(new StubMessage(`!ping test "lorem ipsum"  "dolor sit amet"     ${after}`), "!");
  expect(
    result.success && [
      result.reader.getString(),
      result.reader.getString(),
      result.reader.getString(),
      result.reader.getRemaining(),
    ]
  ).toEqual(["test", "lorem ipsum", "dolor sit amet", after]);

  result = parse(
    new StubMessage(`!ping test "lorem ipsum" \`\`\`this is a test\`\`\`  "dolor sit amet"     ${after}`),
    "!"
  );
  expect(
    result.success && [
      result.reader.getString(),
      result.reader.getString(),
      result.reader.getString(),
      result.reader.getString(),
      result.reader.getRemaining(),
    ]
  ).toEqual(["test", "lorem ipsum", "this is a test", "dolor sit amet", after]);
});
