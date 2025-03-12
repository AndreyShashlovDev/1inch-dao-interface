import { type Config } from 'prettier'

const config: Config = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',

  proseWrap: 'preserve',
  endOfLine: 'lf',

  plugins: ['prettier-plugin-organize-imports'],

  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        useTabs: false,
        printWidth: 140,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      },
    },
  ],
}

export default config
