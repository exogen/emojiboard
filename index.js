const { text } = require("micro");
const { parse } = require("querystring");
const handle = require("./lib/handle");

module.exports = async (req, res) => {
  const input = parse(await text(req));
  console.log(input); // Useful for debugging.
  const arg = (input.text || "").trim().split(/\s+/)[0];
  const fromUser = input.user_id;

  try {
    const output = await handle(arg, fromUser);
    if (output.blocks && output.blocks.length) {
      console.log(`Sending response with ${output.blocks.length} blocks.`);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        response_type: output.responseType || "in_channel",
        text: output.text,
        blocks: output.blocks
      })
    );
  } catch (err) {
    console.error(err);
    if (err.response) {
      const { statusCode } = err.response;
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(err.response.body));
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(err.toString()));
    }
  }
};
