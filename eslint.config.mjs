import eslintJavascript from '@eslint/js';
import eslintTypescript from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default eslintTypescript.config(
  eslintJavascript.configs.recommended,
  ...eslintTypescript.configs.recommended,
  {
    rules: {
      'prefer-const': 'error',
      'prefer-template': 1,
    },
  },
  pluginPrettier,
);
