module.exports = {
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "script"
  },
  env: {
    es6: true,
    node: true
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-console": "off",
    "no-irregular-whitespace": "off"
  }
};
