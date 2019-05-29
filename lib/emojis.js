const got = require("got");
const FormData = require("form-data");
const orderBy = require("lodash.orderby");

const ttl = 1000 * 60;
const token = process.env.SLACK_OAUTH_TOKEN;

if (!token) {
  throw new Error("You need a SLACK_OAUTH_TOKEN.");
}

const api = got.extend({
  baseUrl: "https://slack.com/api",
  headers: {
    Authorization: `Bearer ${token}`
  }
});

let lastResponse;

/**
 * Fetches emojis from the private `emoji.adminList` API and handles all three
 * request modes: single user info, single emoji info, and leaderboard. This
 * should be cleaned up into three separate functions.
 */
async function getEmojis({
  userId,
  emoji: emojiName,
  mostRecent = false,
  since,
  count = 10
} = {}) {
  const now = Date.now();
  const leaderboard = new Map();
  let emojis;
  let sortedUsers;
  if (lastResponse && now - lastResponse.timestamp < ttl) {
    emojis = lastResponse.emojis;
    sortedUsers = lastResponse.sortedUsers;
    console.error("Using cached response! Age:", now - lastResponse.timestamp);
  } else {
    console.error("Requesting fresh response...");
    emojis = new Map();
    try {
      let done = false;
      let page = 1;
      do {
        const formData = new FormData();
        formData.append("page", page.toString());
        formData.append("count", "1000");
        formData.append("sort_by", "created");
        formData.append("sort_dir", "asc");
        const response = await api.post("/emoji.adminList", {
          body: formData
        });
        const body = JSON.parse(response.body);
        if (!body.ok) {
          const err = new Error("Response body indicates not OK");
          err.response = response;
          throw err;
        }
        // Add all emojis to the full list, including aliases.
        body.emoji.forEach(emoji => {
          emojis.set(emoji.name, {
            name: emoji.name,
            isAlias: !!emoji.is_alias,
            aliasFor: emoji.alias_for,
            userId: emoji.user_id,
            userDisplayName: emoji.user_display_name,
            avatarHash: emoji.avatar_hash,
            imageUrl: emoji.url,
            createdAt: emoji.created
          });
        });
        done = body.paging.page >= body.paging.pages;
        page += 1;
      } while (!done);
    } catch (err) {
      throw err;
    }
    const users = new Map();
    emojis.forEach(emoji => {
      // For user stats, don't included aliases as created emojis.
      if (emoji.isAlias) {
        return;
      }
      const stats = users.get(emoji.userId) || {
        userId: emoji.userId,
        userDisplayName: emoji.userDisplayName,
        avatarHash: emoji.avatarHash,
        emojis: []
      };
      stats.emojis.push(emoji);
      users.set(emoji.userId, stats);
    });
    sortedUsers = Array.from(users.values());
    if (!sortedUsers.length) {
      return userId ? null : leaderboard;
    }
    sortedUsers.forEach(user => {
      user.emojis = orderBy(user.emojis, ["createdAt"], ["desc"]);
    });
    sortedUsers = orderBy(
      sortedUsers,
      [
        user => user.emojis.length,
        user => (user.emojis[0] ? user.emojis[0].createdAt : null)
      ],
      ["desc", "asc"]
    );
    lastResponse = {
      emojis,
      sortedUsers,
      timestamp: now
    };
  }
  if (mostRecent) {
    const recentEmojis = Array.from(emojis.values())
      .filter(emoji => !emoji.isAlias)
      .filter(emoji => emoji.createdAt >= since)
      .slice(-count)
      .reverse();
    return recentEmojis;
  }
  // Return single emoji response.
  if (emojiName) {
    const emoji = emojis.get(emojiName);
    if (emoji) {
      if (emoji.aliasFor) {
        let aliased = emojis.get(emoji.aliasFor);
        emoji.aliasForEmoji = aliased;
        while (aliased && aliased.aliasFor) {
          aliased.aliasForEmoji = emojis.get(aliased.aliasFor);
          aliased = aliased.aliasForEmoji;
        }
      }
      return emoji;
    }
    return null;
  }
  let place = 0;
  let placeCount = Infinity;
  let foundUser;
  sortedUsers.forEach((user, i) => {
    if (user.emojis.length) {
      if (user.emojis.length < placeCount) {
        place = i + 1;
        placeCount = user.emojis.length;
      }
      user.place = place;
      if (userId && user.userId === userId) {
        foundUser = user;
      }
      if (userId || place <= count) {
        if (leaderboard.has(place)) {
          leaderboard.get(place).push(user);
        } else {
          leaderboard.set(place, [user]);
        }
      }
    }
  });
  // Return single user response.
  if (userId) {
    if (foundUser) {
      foundUser.tiedWith = leaderboard
        .get(foundUser.place)
        .filter(user => user !== foundUser);
      return foundUser;
    }
    return null;
  }
  return leaderboard;
}

module.exports = getEmojis;
