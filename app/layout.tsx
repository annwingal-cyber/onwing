import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: '瓜田广场',
  description: '记瓜 MVP'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-gray-900">
        {children}
      </body>
    </html>
  )
}
