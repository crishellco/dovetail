module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  globals: {
    chrome: true,
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: ['svelte3'],
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  //   rules: {
  //     'prettier/prettier': 'error',
  //     'svelte3/lint-template': 2,
  //   },
}
