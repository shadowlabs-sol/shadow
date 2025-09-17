import type { Metadata } from 'next';
import { ClientProviders } from '@/components/ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadow Protocol',
  description: 'Privacy-preserving auctions using zero-knowledge cryptography',
  keywords: ['auction', 'privacy', 'blockchain', 'solana', 'MPC', 'zero-knowledge'],
  authors: [{ name: 'Shadow Protocol' }],
  openGraph: {
    title: 'Shadow Protocol',
    description: 'Privacy-preserving auctions using zero-knowledge cryptography',
    type: 'website',
    url: 'https://shadowprotocol.xyz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shadow Protocol',
    description: 'Privacy-preserving auctions using zero-knowledge cryptography',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedSettings = localStorage.getItem('shadowProtocolSettings');
                if (savedSettings) {
                  try {
                    const settings = JSON.parse(savedSettings);
                    if (settings.theme === 'light') {
                      document.documentElement.setAttribute('data-theme', 'light');
                    } else if (settings.theme === 'system') {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if (!prefersDark) {
                        document.documentElement.setAttribute('data-theme', 'light');
                      }
                    }
                  } catch (e) {}
                }
              })();
            `,
          }}
        />
        <div className="noise-overlay" />
        <div className="relative z-10">
          <ClientProviders>
            {children}
          </ClientProviders>
        </div>
      </body>
    </html>
  );
}