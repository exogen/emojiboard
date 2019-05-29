const { MeasuredText, predictFit } = require("./measure");

function formatLeaderResponse(leaders) {
  if (!leaders.size) {
    return { text: "No users on leaderboard!" };
  }

  const text = `OK, here are your top emoji creators…`;
  const blocks = [];

  blocks.push({ type: "divider" });

  leaders.forEach((users, place) => {
    const placeLength = place.toString().length;
    const placePad = Math.max(0, 2 - placeLength);
    const isTied = users.length > 1;

    users.forEach((user, i) => {
      const newestDate = new Date(user.emojis[0].createdAt * 1000);
      const text = new MeasuredText();

      if (i === 0) {
        text.add(`${"\u2007".repeat(placePad)}#${place}`, true);
        text.add("    ");
      } else {
        text.add(`${"\u2007".repeat(Math.max(1, placeLength - 1))}`);
        text.addEmoji(":collision:");
        text.add("   ");
      }

      text.add(user.userDisplayName, place === 1);

      if (place === 1 && !isTied) {
        text.add("  ").addEmoji(":trophy:");
      }

      const countText = new MeasuredText();
      countText.add(`${user.emojis.length}`, place === 1);

      const availableSpace = 280 - (text.width + countText.width);
      const spaceCount = Math.max(2, predictFit(availableSpace, " "));

      const contextPrefix = `\u00a0\u2007\u2007${" ".repeat(
        2 * (placePad + placeLength) + 3
      )} `;

      blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text}${" ".repeat(spaceCount)}${countText}`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `${contextPrefix}Most recent:  ${user.emojis
                .slice(0, 5)
                .map(emoji => `:${emoji.name}:`)
                .join(" ")}\n${contextPrefix}Newest added:  ${formatDate(
                newestDate,
                "date_short_pretty"
              )}`
            }
          ]
        }
      );
    });
    blocks.push({ type: "divider" });
  });

  return { text, blocks };
}

function formatUserResponse(user, { isSelf }) {
  if (!user || !user.emojis.length) {
    return {
      text: `Sorry, ${
        isSelf ? "you’re" : "they’re"
      } not anywhere on the leaderboard.`
    };
  }

  const newestDate = new Date(user.emojis[0].createdAt * 1000);
  const blocks = [];

  const { place } = user;
  const isTied = user.tiedWith && user.tiedWith.length;
  const placeLength = place.toString().length;
  const placePad = Math.max(0, 2 - placeLength);

  const text = new MeasuredText();

  text.add(`${"\u2007".repeat(placePad)}#${place}`, true);
  text.add("    ");
  text.add(user.userDisplayName, place === 1);

  if (place === 1 && !isTied) {
    text.add("  ").addEmoji(":trophy:");
  }

  const countText = new MeasuredText();
  countText.add(`${user.emojis.length}`, place === 1);

  const availableSpace = 280 - (text.width + countText.width);
  const spaceCount = Math.max(2, predictFit(availableSpace, " "));

  const contextPrefix = `\u00a0\u2007\u2007${" ".repeat(
    2 * (placePad + placeLength) + 3
  )} `;

  blocks.push(
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${text}${" ".repeat(spaceCount)}${countText}`
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${contextPrefix}Most recent:  ${user.emojis
            .slice(0, 5)
            .map(emoji => `:${emoji.name}:`)
            .join(" ")}\n${contextPrefix}Newest added:  ${formatDate(
            newestDate,
            "date_short_pretty"
          )}`
        }
      ]
    }
  );

  if (user.tiedWith.length) {
    const moreCount = Math.max(0, user.tiedWith.length - 3);
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            `${contextPrefix}Tied with:  ` +
            user.tiedWith
              .slice(0, 3)
              .map(tiedUser => tiedUser.userDisplayName)
              .join(", ") +
            (moreCount ? `, and ${moreCount} more…` : "")
        }
      ]
    });
  }

  blocks.push({ type: "divider" });

  return {
    text: `Here’s what I found out about ${user.userDisplayName}…`,
    blocks
  };
}

function escapeEmoji(name) {
  return `\`:${name}:\``;
}

function formatDate(date, format = "date_short") {
  return `<!date^${Math.floor(date.getTime() / 1000)}^{${format}}|${date}>`;
}

function formatEmojiResponse(emoji, { name }) {
  if (!emoji) {
    return {
      text: `Sorry, I couldn’t find anything about ${escapeEmoji(
        name
      )} – it’s probably built-in!`
    };
  }

  let text = escapeEmoji(emoji.name);

  if (emoji.aliasFor && !emoji.aliasForEmoji) {
    // Alias for a built-in emoji.
    const date = new Date(emoji.createdAt * 1000);
    text += ` is an alias for the built-in emoji ${escapeEmoji(
      emoji.aliasFor
    )} added by *${emoji.userDisplayName}* on ${formatDate(date)}.`;
  } else if (
    emoji.aliasForEmoji &&
    emoji.userId === emoji.aliasForEmoji.userId
  ) {
    // Same user created emoji and alias.
    const date = new Date(emoji.aliasForEmoji.createdAt * 1000);
    text += ` is an alias for ${escapeEmoji(
      emoji.aliasFor
    )}, which was created by *${
      emoji.aliasForEmoji.userDisplayName
    }* on ${formatDate(date)}.`;
  } else if (emoji.aliasForEmoji) {
    // A different user created the alias and emoji.
    const date = new Date(emoji.aliasForEmoji.createdAt * 1000);
    text += ` is an alias added by *${emoji.userDisplayName}* for \`:${
      emoji.aliasForEmoji.name
    }:\`, which was created by *${
      emoji.aliasForEmoji.userDisplayName
    }* on ${formatDate(date)}.`;
  } else {
    const date = new Date(emoji.createdAt * 1000);
    text += ` was created by *${emoji.userDisplayName}* on ${formatDate(
      date
    )}.`;
  }

  return { text };
}

function formatRecentResponse(emojis, { count, since }) {
  const sinceDate = new Date(since * 1000);

  if (!emojis.length) {
    return {
      text: `Looks like there were no emojis added since ${formatDate(
        sinceDate
      )}! :scream:`
    };
  }

  const text = `Here are the most recent ${count} emojis added since ${sinceDate}…`;
  const blocks = [];

  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Most recent *${count}* emojis added since ${formatDate(
          sinceDate
        )}…`
      }
    },
    { type: "divider" }
  );

  let group;
  const groupedByUser = new Map();

  emojis.forEach(emoji => {
    const userEmojis = groupedByUser.get(emoji.userId) || [];
    userEmojis.push(emoji);
    groupedByUser.set(emoji.userId, userEmojis);
  });

  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emojis.map(emoji => `:${emoji.name}:`).join(" ")}`
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Credits:  ${Array.from(groupedByUser.values())
            .map(group => group[0].userDisplayName)
            .join(", ")}`
        }
      ]
    }
  );

  return { text, blocks };
}

module.exports = {
  formatLeaderResponse,
  formatUserResponse,
  formatEmojiResponse,
  formatRecentResponse
};
