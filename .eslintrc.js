module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: ['babel.config.js', 'jest.config.js', '.eslintrc.js'],
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true }
  },
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/display-name': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'prettier/prettier': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'max-len': ['warn', { code: 120, ignoreComments: true, ignoreStrings: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/no-unresolved': 'off',
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: './tsconfig.json' }
    }
  },
};
