import { Provider } from "./provider"

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en">
          <body
              className={`antialiased`}
          >
              <Provider>{children}</Provider>
          </body>
      </html>
  )
}
