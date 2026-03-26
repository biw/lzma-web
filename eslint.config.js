import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-var': 'off', // Disable for ported C code
      'no-loss-of-precision': 'off', // Disable for ported C code constants
      'prefer-spread': 'off', // Disable for ported C code
      'prefer-const': 'off', // Disable for ported C code
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // Worker globals
        self: 'readonly',
        postMessage: 'readonly',
        addEventListener: 'readonly',
        importScripts: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.yarn/**', 'src/generated/**'],
  },
)
