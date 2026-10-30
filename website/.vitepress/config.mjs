import { defineConfig } from 'vitepress'
import apiSidebar from '../api/typedoc-sidebar.json'

export default defineConfig({
  title: 'Nash TypeScript SDK',
  description: 'Guides and generated API reference for Nash Exchange and Nash Rails.',
  themeConfig: {
    socialLinks: [{ icon: 'github', link: 'https://github.com/nash-io/api-client-typescript' }],
    nav: [
      { text: 'Guides', link: '/guide/getting-started' },
      { text: 'API reference', link: '/api/' }
    ],
    sidebar: {
      '/guide/': [{
        text: 'Guides',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Authentication', link: '/guide/authentication' },
          { text: 'Trading', link: '/guide/trading' },
          { text: 'Subscriptions', link: '/guide/subscriptions' },
          { text: 'Nash Rails', link: '/guide/rails' }
        ]
      }],
      '/api/': apiSidebar
    },
    search: { provider: 'local' },
  }
})
