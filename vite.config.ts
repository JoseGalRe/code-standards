import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    printWidth: 128,
    quoteProps: 'consistent',
    semi: true,
    singleQuote: true,
    sortPackageJson: false,
    tabWidth: 2,
    trailingComma: 'all',
    useTabs: false,
  },
});
