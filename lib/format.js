function formatLeaderResponse(leaders) {
  if (!leaders.size) {
    return { text: "No users on leaderboard!" };
  }

  const text = `OK, here are your top emoji creators…`;
  const blocks = [];

  blocks.push(
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*User*" },
        { type: "mrkdwn", text: "*Count*" }
      ]
    },
    { type: "divider" }
  );

  leaders.forEach((users, place) => {
    users.forEach(user => {
      const newestDate = user.emojis[0].createdAt;
      const newestDateString = new Date(newestDate * 1000).toString();
      blocks.push(
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text:
                place === 1
                  ? `*#${place}* – *${user.userDisplayName}* :trophy:`
                  : `*#${place}* – ${user.userDisplayName}`
            },
            {
              type: "mrkdwn",
              text:
                place === 1
                  ? `*${user.emojis.length}*`
                  : `${user.emojis.length}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text:
                "Most recent additions: " +
                user.emojis
                  .slice(0, 5)
                  .map(emoji => `:${emoji.name}:`)
                  .join(" ")
            },
            {
              type: "mrkdwn",
              text: `Newest added: <!date^${newestDate}^{date_short_pretty}|${newestDateString}>`
            }
          ]
        }
      );
      blocks.push({ type: "divider" });
    });
  });

  return { text, blocks };
}

function formatUserResponse(user) {
  if (!user || !user.emojis.length) {
    return {
      text: `Sorry, ${
        isSelf ? "you’re" : "they’re"
      } not anywhere on the leaderboard.`
    };
  }

  const newestDate = new Date(user.emojis[0].createdAt * 1000);
  const blocks = [];

  blocks.push(
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*User*" },
        { type: "mrkdwn", text: "*Count*" }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text:
            user.place === 1
              ? `*#${user.place}* – *${user.userDisplayName}* :trophy:`
              : `*#${user.place}* – ${user.userDisplayName}`
        },
        {
          type: "mrkdwn",
          text:
            user.place === 1
              ? `*${user.emojis.length}*`
              : `${user.emojis.length}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            "Most recent additions: " +
            user.emojis
              .slice(0, 5)
              .map(emoji => `:${emoji.name}:`)
              .join(" ")
        },
        {
          type: "mrkdwn",
          text: `Newest added: ${formatDate(newestDate, "date_short_pretty")}`
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
            "Tied with: " +
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

function formatEmojiResponse(emoji) {
  if (!emoji) {
    return {
      text: `Sorry, I couldn’t find anything about :${
        options.emoji
      }: – it’s probably built-in!`
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

module.exports = {
  formatLeaderResponse,
  formatUserResponse,
  formatEmojiResponse
};
