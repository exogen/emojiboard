const getEmojis = require("./emojis");
const {
  formatLeaderResponse,
  formatUserResponse,
  formatEmojiResponse,
  formatRecentResponse
} = require("./format");

const userRegex = /<@(U\w+)|[^>]+>/;
const emojiRegex = /:([^:\s]+):/;
const thirtyDays = 1000 * 60 * 60 * 24 * 30;

async function handle(arg, fromUser) {
  const isSelf = arg === "me";
  const isMostRecent = arg === "recent" || arg === "new";
  const userMatch = userRegex.exec(arg);
  const emojiMatch = emojiRegex.exec(arg);
  const options = {};
  let bogusInput = false;

  if (isSelf) {
    options.userId = fromUser;
  } else if (isMostRecent) {
    options.mostRecent = true;
    options.count = 15;
    const since = new Date(Date.now() - thirtyDays);
    since.setHours(0);
    since.setMinutes(0);
    since.setSeconds(0);
    since.setMilliseconds(0);
    options.since = Math.floor(since.getTime() / 1000);
  } else if (userMatch) {
    options.userId = userMatch[1];
  } else if (emojiMatch) {
    options.emoji = emojiMatch[1];
  } else if (arg) {
    const count = parseInt(arg, 10);
    if (Number.isNaN(count) || count < 1) {
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
    } else if (options.mostRecent) {
      const recentEmojis = await getEmojis(options);
      output = formatRecentResponse(recentEmojis, options);
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
