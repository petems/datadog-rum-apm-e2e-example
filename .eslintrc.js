module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Code quality
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'consistent-return': 'error',
    'no-implicit-globals': 'error',
    
    // Style (handled by Prettier, but some logical rules)
    'prefer-template': 'error',
    'object-shorthand': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  },
  overrides: [
    {
      // Test files can use console.log
      files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};