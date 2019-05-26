const getEmojis = require("./emojis");
const {
  formatLeaderResponse,
  formatUserResponse,
  formatEmojiResponse
} = require("./format");

const userRegex = /<@(U\w+)|[^>]+>/;
const emojiRegex = /:([^:\s]+):/;

async function handle(arg, fromUser) {
  const isSelf = arg === "me";
  const userMatch = userRegex.exec(arg);
  const emojiMatch = emojiRegex.exec(arg);
  const options = {};
  let bogusInput = false;

  if (isSelf) {
    options.userId = fromUser;
  } else if (userMatch) {
    options.userId = userMatch[1];
  } else if (emojiMatch) {
    options.emoji = emojiMatch[1];
  } else if (arg) {
    const count = parseInt(arg, 10);
    if (Number.isNaN(count)) {
      bogusInput = true;
    } else {
      options.count = count;
    }
  }

  let output;

  if (bogusInput) {
    output = {
      responseType: "ephemeral",
      text: "Sorry, I don’t understand that."
    };
  } else {
    if (options.userId) {
      const user = await getEmojis(options);
      output = formatUserResponse(user, { isSelf });
    } else if (options.emoji) {
      const emoji = await getEmojis(options);
      output = formatEmojiResponse(emoji, { name: options.emoji });
    } else {
      const leaders = await getEmojis(options);
      output = formatLeaderResponse(leaders);
    }
  }

  if (output.blocks && output.blocks.length > 50) {
    output.blocks = output.blocks.slice(-49);
    // Start at the first divider after truncating.
    const dividerIndex = output.blocks.findIndex(
      block => block.type === "divider"
    );
    if (dividerIndex > 0) {
      output.blocks = output.blocks.slice(dividerIndex);
    }
    output.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          ":warning: Truncated the beginning of the message due to Slack’s output limit. Sorry!"
      }
    });
  }

  return output;
}

module.exports = handle;

if (require.main === module) {
  const options = { json: false };
  const args = [];
  process.argv.slice(2).forEach(arg => {
    switch (arg) {
      case "--json":
        options.json = true;
        break;
      default:
        args.push(arg);
    }
  });
  const { inspect } = require("util");
  handle(...args).then(
    output => {
      if (options.json) {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(inspect(output, { colors: true, depth: 4 }));
      }
    },
    err => {
      console.error(err);
    }
  );
}
