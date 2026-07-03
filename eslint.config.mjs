import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import react from 'eslint-plugin-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const appGlobals = {
  ...globals.browser,
  ...globals.es2021,
  ...globals.jest,
};

const reactSettings = {
  react: {
    version: 'detect',
  },
};

const sharedRules = {
  'global-require': 'off',
  'default-param-last': 'off',
  'implicit-arrow-linebreak': 'off',
};

const typescriptConfigs = tseslint.configs.recommended.map(config => ({
  ...config,
  files: ['src/**/*.{ts,tsx}'],
}));

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'src/assets/**/*.js',
    ],
  },
  js.configs.recommended,
  ...typescriptConfigs,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: {
          jsx: true,
        },
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      globals: {
        ...appGlobals,
      },
    },
    plugins: {
      react,
    },
    settings: reactSettings,
    rules: {
      ...react.configs.recommended.rules,
      ...sharedRules,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...appGlobals,
      },
    },
    plugins: {
      react,
    },
    settings: reactSettings,
    rules: {
      ...react.configs.recommended.rules,
      ...sharedRules,
      'no-undef': 'off',
      'react/prop-types': 'off',
    },
  },
];
