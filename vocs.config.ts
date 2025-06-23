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
  logoUrl: '/logo.png',
  iconUrl: '/favicon.ico',
  theme: {
		accentColor: { light: "#7115AA", dark: "#a66cc9" },
	},
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
    },
    // plugins: [
    //   {
    //     name: "batua-install-api-route",
    //     config(_, { command }) {
    //       console.debug(`[batua-install-api-route] plugin init for command: ${command}`)
    //     },
    //     configureServer(server) {
    //       console.debug("[batua-install-api-route] configureServer")
    //       // server.middlewares.use("/", (req: any, res: any) => handler(req, res))
    //       server.httpServer?.on("request", (req: any, res: any) => {
    //         console.debug("[batua-install-api-route] request")
    //         handler(req, res)
    //       })
    //       // server.handle("/install", (req: any, res: any) => handler(req, res))
    //     },
    //     configurePreviewServer(server) {
    //       console.debug("[batua-install-api-route] configurePreviewServer")
    //       // server.middlewares.use("/", (req: any, res: any) => handler(req, res))
    //       server.httpServer?.on("request", (req: any, res: any) => {
    //         console.debug("[batua-install-api-route] request")
    //         handler(req, res)
    //       })
    //     },
    //   },
    // ],
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