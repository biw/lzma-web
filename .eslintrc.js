module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:prettier/recommended", // should always be the end
  ],
  ignorePatterns: ["**/docs/*.ts"],
  plugins: ["@typescript-eslint", "prettier"],
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
    jest: true,
    es6: true,
  },
};
