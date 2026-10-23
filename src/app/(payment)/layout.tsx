import type { Metadata, Viewport } from 'next'
import { Prompt } from 'next/font/google'
import './globals.css'

const prompt = Prompt({ subsets: ['latin', 'thai'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--payment-font' })
export const metadata: Metadata = {
  title: 'Payment | VETRA',
  robots: { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false, noimageindex: true } },
  referrer: 'no-referrer',
  icons: { icon: '/favicon.svg' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f4fa', colorScheme: 'light' }

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th" className={prompt.variable}><body>{children}</body></html>
}
