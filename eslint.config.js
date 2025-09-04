const js = require('@eslint/js');
const globals = require('globals');
const regexp = require('eslint-plugin-regexp');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es2021,
        ...globals.jest,
        ...globals.node,
      },
    },
    plugins: {
      regexp,
    },
    rules: {
      // Error prevention
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',

      // Code quality
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'consistent-return': 'error',
      'no-implicit-globals': 'error',

      // Style (handled by Prettier, but some logical rules)
      'prefer-template': 'error',
      'object-shorthand': 'error',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Regex safety to avoid catastrophic backtracking (ReDoS)
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/no-useless-quantifier': 'warn',
    },
  },
  // Ignore linting for vendored/minified third-party bundles and client build artifacts
  { ignores: ['public/vendor/**', 'client/**', 'dist/**'] },
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
