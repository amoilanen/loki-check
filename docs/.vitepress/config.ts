import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'check-loki',
  description: 'Composable, seeded data generators for TypeScript / JavaScript',
  base: '/check-loki/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  themeConfig: {
    logo: '/logo.jpg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/amoilanen/check-loki' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Concepts', link: '/guide/concepts' },
            { text: 'Custom generators', link: '/guide/custom-generators' },
            { text: 'Combinators', link: '/guide/combinators' },
            { text: 'Quantifiers', link: '/guide/quantifiers' },
            { text: 'Shrinking', link: '/guide/shrinking' },
            { text: 'Recipes', link: '/guide/recipes' },
            { text: 'Migration from ScalaCheck', link: '/guide/migration-from-scalacheck' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Building generators',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Address', link: '/examples/address' },
            { text: 'Object generation', link: '/examples/object-generation' },
            { text: 'Phone number', link: '/examples/phone' },
            { text: 'IPv4 address', link: '/examples/ipv4' },
            { text: 'Email', link: '/examples/email' },
            { text: 'UUID', link: '/examples/uuid' },
            { text: 'Variable name', link: '/examples/variable-name' },
            { text: 'Credit card (Luhn)', link: '/examples/credit-card' },
            { text: 'Weighted user', link: '/examples/weighted-user' },
            { text: 'Recursive JSON', link: '/examples/json' },
            { text: 'Sized tree', link: '/examples/sized-tree' },
            { text: 'Build from scratch', link: '/examples/build-from-scratch' },
          ],
        },
        {
          text: 'Property-based testing',
          items: [
            { text: 'Property test', link: '/examples/property-test' },
            { text: 'Round-trip', link: '/examples/round-trip' },
            { text: 'Idempotence & laws', link: '/examples/idempotence' },
            { text: 'Sorted array', link: '/examples/sorted-array' },
            { text: 'Model-based test', link: '/examples/model-based' },
            { text: 'Existential search', link: '/examples/exists' },
            { text: 'Custom shrinker', link: '/examples/custom-shrinker' },
          ],
        },
      ],
      '/api/': [{ text: 'API Reference', link: '/api/' }],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/amoilanen/check-loki' }],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2020-present check-loki contributors',
    },
  },
});
