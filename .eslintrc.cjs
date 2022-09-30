module.exports = {
  ignorePatterns: ['**/dist/*', '**/coverage/*'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'no-constant-condition': ['error', { checkLoops: false }]
  }
};
