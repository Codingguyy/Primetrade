import './globals.css'

export const metadata = {
  title: 'PrimeTrade',
  description: 'task management app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
