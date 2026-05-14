import { mockCampaigns } from '@/lib/mockData';

export function generateStaticParams() {
  return mockCampaigns.map((c) => ({ campaignId: c.id }));
}

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
