module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended', // should always be the end
  ],
  ignorePatterns: ['**/docs/*.ts'],
  plugins: ['@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    jest: true,
    browser: true,
    es2022: true,
    worker: true,
    mocha: true,
  },
}
