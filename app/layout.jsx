import './globalstyles.css'

export const metadata = {
  title: 'Tavus-Powered Alameda Guide',
  description: 'Scroll-story demo: search → ask → Tavus video.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
