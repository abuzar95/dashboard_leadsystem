import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/AuthGuard'

export const metadata: Metadata = {
  title: 'Prospect Management Dashboard',
  description: 'Manage your prospects efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
