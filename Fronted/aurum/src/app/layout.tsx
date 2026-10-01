import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AURUM Service Intelligence — Operations Command Center',
  description:
    'Enterprise Service Operations Command Center consolidating physical asset health, IoT telemetry, fault analytics, PM schedules, and contract management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-[#1E293B]">
        {children}
      </body>
    </html>
  );
}
