import eslintJavascript from '@eslint/js';
import eslintTypescript from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  { ignores: ['src/upstream/**'] },
  eslintJavascript.configs.recommended,
  ...eslintTypescript.configs.recommended,
  pluginPrettier,
  {
    rules: {
      curly: ['error', 'all'],
      'prefer-const': 'error',
      'prefer-template': 1,
    },
  },
];
