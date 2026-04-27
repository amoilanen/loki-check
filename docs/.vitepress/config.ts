import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'gen.js',
  description: 'Composable, seeded data generators for TypeScript / JavaScript',
  base: '/gen.js/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/antivanov/gen.js' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Concepts', link: '/guide/concepts' },
            { text: 'Combinators', link: '/guide/combinators' },
            { text: 'Quantifiers', link: '/guide/quantifiers' },
            { text: 'Migration from ScalaCheck', link: '/guide/migration-from-scalacheck' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Address', link: '/examples/address' },
            { text: 'Object generation', link: '/examples/object-generation' },
            { text: 'Phone number', link: '/examples/phone' },
            { text: 'Property test', link: '/examples/property-test' },
            { text: 'UUID', link: '/examples/uuid' },
            { text: 'Variable name', link: '/examples/variable-name' },
          ],
        },
      ],
      '/api/': [{ text: 'API Reference', link: '/api/' }],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/antivanov/gen.js' }],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2020-present gen.js contributors',
    },
  },
});
