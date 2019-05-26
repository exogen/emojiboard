/**
 * Slack doesn't provide the best layout mechanisms. Columnar layout is
 * especially troublesome, as even two-column layout is not possible on mobile
 * (the second column appears on the next line). So in some cases, we just use
 * spaces to do layout.
 */
const emojiWidth = 22;

const metrics = {
  "0": 8.6875,
  "1": 8.6875,
  "2": 8.6875,
  "3": 8.6875,
  "4": 8.6875,
  "5": 8.6875,
  "6": 8.6875,
  "7": 8.6875,
  "8": 8.6875,
  "9": 8.6875,
  A: 10.140625,
  B: 9.6875,
  C: 10.015625,
  D: 11.40625,
  E: 8.65625,
  F: 8.46875,
  G: 10.953125,
  H: 11.4375,
  I: 4.1875,
  J: 6.328125,
  K: 9.9375,
  L: 7.6875,
  M: 13.921875,
  N: 11.4375,
  O: 12,
  P: 9,
  Q: 12,
  R: 9.390625,
  S: 8.125,
  T: 8.84375,
  U: 11.03125,
  V: 10.140625,
  W: 15.53125,
  X: 9.734375,
  Y: 9.359375,
  Z: 9.015625,
  a: 7.453125,
  ä: 7.453125,
  b: 8.390625,
  c: 7.15625,
  d: 8.390625,
  e: 7.90625,
  f: 5.25,
  g: 7.796875,
  h: 8.359375,
  i: 3.59375,
  j: 3.59375,
  k: 7.609375,
  l: 3.53125,
  m: 12.328125,
  n: 8.359375,
  ñ: 8.359375,
  o: 8.5,
  p: 8.40625,
  q: 8.390625,
  r: 5.453125,
  s: 6.484375,
  t: 5.375,
  u: 8.359375,
  ü: 8.359375,
  v: 7.734375,
  w: 11.78125,
  x: 7.46875,
  y: 7.71875,
  z: 6.765625,
  ".": 3.53125,
  "-": 5.5625,
  "#": 8.6875,
  "\u00a0": 3.828125, // Non-breaking space.
  "\u2007": 8.6875, // Figure space.
  "\u2009": 1.875, // Thin space.
  "─": 11.25,
  "━": 15,
  "'": 3.046875,
  "‘": 3.203125,
  "’": 3.1875,
  " ": 3.828125 // Normal space.
};

const allWidths = Array.from(Object.values(metrics));
const averageWidth =
  allWidths.reduce((sum, width) => sum + width, 0) / allWidths.length;

function predictWidth(text, isBold) {
  let width = Array.from(text).reduce((width, char) => {
    const { [char]: charWidth = averageWidth } = metrics;
    return width + charWidth;
  }, 0);
  width *= 0.99315; // Account for kerning.
  if (isBold) {
    width *= 1.02; // Account for bolding.
  }
  return width;
}

function predictFit(width, char, round = "round") {
  const { [char]: charWidth = averageWidth } = metrics;
  return Math[round](width / charWidth);
}

class MeasuredText {
  constructor() {
    this.text = "";
    this.width = 0;
  }

  toString() {
    return this.text;
  }

  add(text, isBold) {
    if (isBold) {
      this.text += `*${text}*`;
      this.width += predictWidth(text, true);
    } else {
      this.text += text;
      this.width += predictWidth(text);
    }
    return this;
  }

  addEmoji(...emojis) {
    this.text += emojis.join("");
    this.width += emojis.length * emojiWidth;
    return this;
  }
}

module.exports = {
  emojiWidth,
  predictWidth,
  predictFit,
  MeasuredText
};
