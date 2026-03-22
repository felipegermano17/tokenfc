import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClubActionDeck } from "@/components/club-action-deck";
import { ClubSignalBand } from "@/components/club-signal-band";
import {
  DashboardModal,
  type DashboardModalKey,
} from "@/components/dashboard-modal";
import {
  activityFeed,
  appBalance,
  campaignContext,
  contestArts,
  defaultActivityItem,
  defaultContestArt,
  defaultProduct,
  formatNumber,
  formatTfc,
  getProductById,
} from "@/lib/data";
import { resolveActiveClub, withClubModal } from "@/lib/club-routing";
import { ClubHero } from "@/components/tokenfc-ui";

const allowedModals: DashboardModalKey[] = [
  "campaign",
  "topup",
  "shop",
  "checkout",
  "activity",
  "ranking",
];

export default async function ClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ modal?: string; product?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const club = resolveActiveClub(slug);
  const activeModal = allowedModals.includes(query.modal as DashboardModalKey)
    ? (query.modal as DashboardModalKey)
    : null;
  const activeProduct = getProductById(query.product ?? "") ?? defaultProduct;

  if (!club) {
    notFound();
  }

  return (
    <AppShell
      activeClub={club}
      balance={appBalance.main}
      mainClassName="app-main-club"
      shellClassName="app-shell-club"
    >
      <div
        aria-hidden={activeModal ? true : undefined}
        className={activeModal ? "club-dashboard-page dashboard-underlay stack-2xl" : "club-dashboard-page stack-2xl"}
      >
        <ClubHero
          balance={appBalance.main}
          club={club}
          context={[
            { label: "Arte lider", value: campaignContext.currentLeader },
            { label: "Total comprometido", value: formatTfc(defaultContestArt.totalTfc) },
            { label: "Apoiadores", value: formatNumber(defaultContestArt.supporters) },
          ]}
          copy={campaignContext.heroSupport}
          ctaHref={withClubModal(club.slug, "campaign")}
          ctaLabel="Abrir campanha"
          title={campaignContext.heroTitle}
        />

        <ClubSignalBand balance={appBalance.main} club={club} />

        <ClubActionDeck
          balance={appBalance.main}
          campaignTimeLeft={campaignContext.timeLeft}
          club={club}
          hrefs={{
            activity: withClubModal(club.slug, "activity"),
            campaign: withClubModal(club.slug, "campaign"),
            shop: withClubModal(club.slug, "shop"),
            topup: withClubModal(club.slug, "topup"),
          }}
          leader={campaignContext.currentLeader}
          product={defaultProduct}
          recentActivity={defaultActivityItem}
        />
      </div>

      {activeModal ? <DashboardModal club={club} modal={activeModal} product={activeProduct} /> : null}
    </AppShell>
  );
}
