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
import { getClubDashboard } from "@/lib/api";
import { resolveActiveClub, withClubModal } from "@/lib/club-routing";
import { LiveClubHero } from "@/components/live-club-hero";
import { normalizeTfcNumber } from "@/lib/tfc";

export const dynamic = "force-dynamic";

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
  const dashboard = await getClubDashboard(slug);
  const activeModal = allowedModals.includes(query.modal as DashboardModalKey)
    ? (query.modal as DashboardModalKey)
    : null;

  if (!club) {
    notFound();
  }

  const featuredShopProduct = dashboard?.shopProducts[0] ?? null;
  const selectedShopProduct =
    dashboard?.shopProducts.find(
      (product) => product.id === query.product || product.sku === query.product,
    ) ?? featuredShopProduct;
  const featuredProduct = featuredShopProduct
      ? {
          emphasis: "Destaque",
          id: featuredShopProduct.id,
          name: featuredShopProduct.name,
          note: "Produto ativo conectado ao catalogo seedado da demo.",
          price: normalizeTfcNumber(featuredShopProduct.priceTfcRaw, defaultProduct.price),
      }
    : defaultProduct;
  const activeProduct =
    getProductById(query.product ?? "") ??
    (selectedShopProduct
      ? {
          emphasis: "Destaque",
          id: selectedShopProduct.id,
          name: selectedShopProduct.name,
          note: "Produto ativo conectado ao catalogo seedado da demo.",
          price: normalizeTfcNumber(selectedShopProduct.priceTfcRaw, defaultProduct.price),
        }
      : featuredProduct);
  const leaderLabel = dashboard?.contest?.designs[0]?.title ?? campaignContext.currentLeader;
  const heroTitle = dashboard?.contest?.title ?? campaignContext.heroTitle;
  const heroCopy =
    dashboard?.contest
      ? "A torcida acompanha a disputa da camisa com dados reais do backend sem sair do painel do clube."
      : campaignContext.heroSupport;
  const heroContext = dashboard
    ? [
        { label: "Arte lider", value: leaderLabel },
        { label: "Produtos ativos", value: formatNumber(dashboard.shopProducts.length) },
        {
          label: "Torcida no clube",
          value: formatNumber(dashboard.metrics.supportersCount),
        },
      ]
    : [
        { label: "Arte lider", value: campaignContext.currentLeader },
        { label: "Total comprometido", value: formatTfc(defaultContestArt.totalTfc) },
        { label: "Apoiadores", value: formatNumber(defaultContestArt.supporters) },
      ];

  return (
    <AppShell
      activeClub={club}
      balance={0}
      mainClassName="app-main-club"
      shellClassName="app-shell-club"
    >
      <div
        aria-hidden={activeModal ? true : undefined}
        className={activeModal ? "club-dashboard-page dashboard-underlay stack-2xl" : "club-dashboard-page stack-2xl"}
      >
        <LiveClubHero
          balance={0}
          club={club}
          context={heroContext}
          copy={heroCopy}
          ctaHref={withClubModal(club.slug, "campaign")}
          ctaLabel="Abrir campanha"
          title={heroTitle}
        />

        <ClubSignalBand
          balance={0}
          club={club}
          supportersCount={dashboard?.metrics.supportersCount}
          totalPower={
            dashboard?.metrics ? Number(dashboard.metrics.totalPowerRaw) : undefined
          }
        />

        <ClubActionDeck
          balance={0}
          campaignTimeLeft={campaignContext.timeLeft}
          club={club}
          hrefs={{
            activity: withClubModal(club.slug, "activity"),
            campaign: withClubModal(club.slug, "campaign"),
            shop: withClubModal(club.slug, "shop"),
            topup: withClubModal(club.slug, "topup"),
          }}
          leader={leaderLabel}
          product={featuredProduct}
          recentActivity={defaultActivityItem}
        />
      </div>

      {activeModal ? (
        <DashboardModal
          club={club}
          contest={dashboard?.contest}
          modal={activeModal}
          product={activeProduct}
          selectedProduct={selectedShopProduct}
          shopProducts={dashboard?.shopProducts}
        />
      ) : null}
    </AppShell>
  );
}
