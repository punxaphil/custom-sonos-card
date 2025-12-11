import eslintJavascript from '@eslint/js';
import eslintTypescript from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  eslintJavascript.configs.recommended,
  ...eslintTypescript.configs.recommended,
  {
    rules: {
      curly: 'error',
      'prefer-const': 'error',
      'prefer-template': 1,
    },
  },
  pluginPrettier,
];
