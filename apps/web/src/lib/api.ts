export type ClubDashboardContestDesign = {
  id: string;
  onchainDesignId: string;
  title: string;
  creatorLabel: string;
  previewImageUrl: string;
  metadataUri: string | null;
  supportersCount: number;
  totalTfcRaw: string;
};

export type ClubDashboardContest = {
  id: string;
  onchainContestId: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string;
  treasuryAddress: string;
  designs: ClubDashboardContestDesign[];
} | null;

export type ClubDashboardShopProduct = {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  priceTfcRaw: string;
};

export type ClubDashboardResponse = {
  club: {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    badgeImageUrl: string;
    mockJerseyImageUrl: string;
  };
  metrics: {
    supportersCount: number;
    totalPowerRaw: string;
    topupVolumeRaw: string;
    supportVolumeRaw: string;
    shopVolumeRaw: string;
  };
  contest: ClubDashboardContest;
  shopProducts: ClubDashboardShopProduct[];
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.API_URL?.trim() ||
  "http://127.0.0.1:4000";

export async function getClubDashboard(slug: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/clubs/${slug}/dashboard`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ClubDashboardResponse;
  } catch {
    return null;
  }
}
