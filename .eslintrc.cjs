module.exports = {
  env: { es2022: true, node: true },
  extends: ['airbnb-base', 'plugin:prettier/recommended'], // matikan rules yg tabrakan
  plugins: ['prettier'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: {
    'import/resolver': { node: { extensions: ['.js'] } },
  },
  rules: {
    'no-console': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
    'class-methods-use-this': 'off',
    'no-underscore-dangle': [
      'error',
      {
        allowAfterThis: true,
        allowAfterSuper: true,
        enforceInMethodNames: false,
      },
    ],
    'prettier/prettier': ['error', { endOfLine: 'lf' }],
  },
};
