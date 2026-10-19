import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CHRIST (Deemed to be University) | Smart Attendance ERP',
  description: 'Official Christ University Smart Attendance & Academic Management System with 2FA Physical Proximity Verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('smart_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col antialiased selection:bg-zinc-800 selection:text-white transition-colors duration-200`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
