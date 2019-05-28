const crypto = require("crypto");
const { text, createError } = require("micro");

const secret = process.env.SLACK_SIGNING_SECRET;

if (!secret) {
  throw new Error("You need a SLACK_SIGNING_SECRET.");
}

async function verifySlackRequest(req) {
  const signature = req.headers["x-slack-signature"];
  const timestamp = req.headers["x-slack-request-timestamp"];
  const body = await text(req);

  const hmacDigest = crypto
    .createHmac("sha256", secret)
    .update(`v0:${timestamp}:${body}`)
    .digest("hex");

  const ourSignature = `v0=${hmacDigest}`;

  if (ourSignature !== signature) {
    throw createError(400, "Invalid signature.");
  }
}

module.exports = verifySlackRequest;
