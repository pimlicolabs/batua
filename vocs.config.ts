import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Batua',
  description: 'Easy to integrate embedded smart account secured by passkeys',
  logoUrl: '/logo.svg',
  iconUrl: '/favicon.ico',
  sidebar: [
    {
      text: 'Getting Started',
      link: '/getting-started',
    },
    {
      text: 'Installation',
      link: '/installation',
    },
    {
      text: 'Usage',
      link: '/usage',
    },
    {
      text: 'Batch Transactions',
      link: '/batch-transactions',
    },
    {
      text: 'Customization',
      link: '/customization',
    },
    {
      text: 'Try Batua',
      link: '/try-batua',
    },
  ],
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/pimlicolabs/batua',
    },
  ],
})
