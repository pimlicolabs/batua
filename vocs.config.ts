import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vocs'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  title: 'Batua',
  description: 'Easy to integrate embedded smart account secured by passkeys',
  logoUrl: '/logo.svg',
  iconUrl: '/favicon.ico',
  vite: {
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      }
    },
    define: {
      "process.env.VITE_PUBLIC_PIMLICO_API_KEY": JSON.stringify(process.env.VITE_PUBLIC_PIMLICO_API_KEY ?? ""),
      "process.env.VITE_PUBLIC_SPONSORSHIP_POLICY_ID": JSON.stringify(process.env.VITE_PUBLIC_SPONSORSHIP_POLICY_ID ?? "")
    }
  },
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