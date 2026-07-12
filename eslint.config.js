// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // ── Base recommended rules ───────────────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript source files ───────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals (process, console, __dirname, Buffer, setTimeout, etc.)
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-duplicate-imports': 'error',
      // Disable no-undef — TypeScript compiler catches undefined references
      'no-undef': 'off',
    },
  },

  // ── Test files — add Jest globals ────────────────────────────────────────
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // ── Prettier must be last ─────────────────────────────────────────────────
  prettier,

  // ── Ignores ───────────────────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/*.js',
      '**/*.d.ts',
      '.nx/**',
      'prisma/migrations/**',
    ],
  },
];

