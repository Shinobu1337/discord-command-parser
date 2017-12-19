// separates arguments with full "quote and \"escape\" support."
const RE_ARG_MATCHER = /"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\S+/g

// trims " and " from the start and end of a string
const RE_QUOTE_STRIP = /^"+|"+$|^'+|'+$/g

// basically String.prototype.trimEnd() but not deprecated.
const RE_TRIM_TRAILING_SPACES = /[\s\uFEFF\xA0]+$/g

// test if string starts with whitespace.
const RE_STARTS_WITH_WHITESPACE = /^\s/  

// made by Xzlash - <xzl4sh gmail com>

function parse (prefix, {author, client, content}) {
  const result = {
    //success: null,
    //prefix: null,
    //command: null,
    //arguments: null,
    //error: null,
    //code: null
  }
  try {
    if (author.bot) {
      result.success = false
      result.error = 'bot user'
      result.code = 'BOT_USER'
      return result
    }
    
    if (author.id === client.user.id) {
      result.success = false
      result.error = 'message sent from self'
      result.code = 'SELF_MESSAGE'
      return result
    }
    
    if (!content.startsWith(prefix)) {
      result.success = false
      result.error = 'content does not begin with prefix'
      result.code = 'NO_PREFIX_MATCH'
      return result
    }

    // now we parse the message
    
    let remaining = content.slice(prefix.length)
    if (!remaining.length) {
      result.success = false
      result.error = 'no body to message, only a prefix'
      result.code = 'NO_BODY'
      return result
    }
    
    if (RE_STARTS_WITH_WHITESPACE.test(remaining)) {
      result.success = false
      result.error = 'whitespace after prefix'
      result.code = 'WHITESPACE_AFTER_PREFIX'
      return result
    }
    
    let args = getArgs(remaining)
    
    result.success = true
    result.code = 'OK';
    result.prefix = prefix
    result.command = args.shift() // the command is the first item in the array ;)
    result.arguments = args
    
    return result
  } catch (e) {
    result.success = false
    result.error = e.stack
    result.code = 'UNKNOWN_ERROR'
    return result
  }
}

function getArgs (str) {
  // trim whitespace off the end
  str = str.trimRight()
  
  // get the arguments using the magic regex
  let splitted = str.match(RE_ARG_MATCHER)
  
  // map it to remove the quotes (if any)
  return splitted.map(v => v.replace(RE_QUOTE_STRIP, ''))
}

module.exports = parse
