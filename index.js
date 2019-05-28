const { text, send } = require("micro");
const { parse } = require("querystring");
const handle = require("./lib/handle");
const verifySlackRequest = require("./lib/verify");

module.exports = async (req, res) => {
  try {
    await verifySlackRequest(req);
  } catch (err) {
    send(res, err.statusCode, err.toString());
    return;
  }
  const input = parse(await text(req));
  console.log(input); // Useful for debugging.
  const arg = (input.text || "").trim().split(/\s+/)[0];
  const fromUser = input.user_id;

  try {
    const output = await handle(arg, fromUser);
    if (output.blocks && output.blocks.length) {
      console.log(`Sending response with ${output.blocks.length} blocks.`);
    }
    send(res, 200, {
      response_type: output.responseType || "in_channel",
      text: output.text,
      blocks: output.blocks
    });
  } catch (err) {
    console.error(err);
    if (err.response) {
      const { statusCode } = err.response;
      send(res, statusCode, err.response.body);
    } else {
      send(res, 500, err.toString());
    }
  }
};
