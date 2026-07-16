/**
 * ESLint flat config — @eslint/js recommended rules plus a few stricter
 * correctness/consistency rules, split by runtime (Node backend & tests vs.
 * browser frontend).
 */
import js from '@eslint/js';
import globals from 'globals';

const strictRules = {
  eqeqeq: ['error', 'smart'],
  'prefer-const': 'error',
  'no-var': 'error',
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-console': 'off', // the structured logger is the only console user
  'no-implicit-coercion': ['error', { allow: ['!!'] }],
  'object-shorthand': 'error',
};

export default [
  { ignores: ['node_modules/', '.vercel/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'test/**/*.js', 'api/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: strictRules,
  },
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: strictRules,
  },
];
