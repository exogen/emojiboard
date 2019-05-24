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
      output = formatUserResponse(user);
    } else if (options.emoji) {
      const emoji = await getEmojis(options);
      output = formatEmojiResponse(emoji);
    } else {
      const leaders = await getEmojis(options);
      output = formatLeaderResponse(leaders);
    }
  }

  if (output.blocks && output.blocks.length > 50) {
    output.blocks = output.blocks.slice(0, 49);
    output.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          ":warning: There’s more, but Slack won’t let me output that much stuff. Sorry!"
      }
    });
  }

  return output;
}

module.exports = handle;

if (require.main === module) {
  const arg = process.argv[2];
  const { inspect } = require("util");
  handle(arg).then(
    output => {
      console.log(inspect(output, { colors: true, depth: 4 }));
    },
    err => {
      console.error(err);
    }
  );
}
