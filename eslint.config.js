// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  { ignores: ['**/dist/', '**/node_modules/', 'logs/', 'packages/db/src/generated/'] },

  js.configs.recommended,

  // TypeScript sources: type-aware rules, using each workspace's tsconfig.json.
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow async DOM/chrome event listeners; floating promises elsewhere are still reported.
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }]
    }
  },

  // packages/core must stay free of browser/extension APIs so the server can reuse it.
  {
    files: ['packages/core/src/**/*.ts'],
    languageOptions: { globals: { ...globals.es2022 } },
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'chrome', 'browser', 'indexedDB', 'localStorage']
    }
  },

  { files: ['packages/core/test/**/*.ts'], languageOptions: { globals: { ...globals.node } } },

  { files: ['apps/extension/src/**/*.ts'], languageOptions: { globals: { ...globals.browser } } },

  {
    files: ['packages/db/**/*.ts', 'apps/backend-shell/**/*.ts'],
    languageOptions: { globals: { ...globals.node } }
  },

  // Node scripts and config files (not part of any tsconfig, so no type-aware rules).
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: { ...globals.node } } },

  // Must come last: turns off rules that conflict with Prettier.
  prettier
);
