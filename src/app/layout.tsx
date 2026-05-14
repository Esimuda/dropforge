import './globals.css';
import { Providers } from '@/providers';

export const metadata = {
  title: 'Dropforge',
  description: 'Complete Quests. Earn Rewards. Claim Airdrops.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
