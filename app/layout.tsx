import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
