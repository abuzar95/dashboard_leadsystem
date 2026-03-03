import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/AuthGuard'

const APP_NAME = 'Lead System'
const APP_DESCRIPTION = 'Prospect Management Dashboard - Manage your prospects efficiently'

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: 'Prospect Management Dashboard',
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
