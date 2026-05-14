import { mockCampaigns } from '@/lib/mockData';

export function generateStaticParams() {
  return mockCampaigns.map((c) => ({ id: c.id }));
}

export default function CampaignDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
