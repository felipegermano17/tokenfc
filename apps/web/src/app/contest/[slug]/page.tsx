import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CampaignExperience } from "@/components/campaign-experience";
import { PageIntro, Surface } from "@/components/tokenfc-ui";
import { appBalance, campaignContext } from "@/lib/data";
import { resolveActiveClub } from "@/lib/club-routing";

export default async function ContestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ club?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  if (slug !== campaignContext.contestSlug) {
    notFound();
  }

  const club = resolveActiveClub(undefined, query.club);

  return (
    <AppShell activeClub={club} balance={appBalance.main}>
      <div className="stack-2xl">
        <PageIntro
          eyebrow={`Campanha ativa - encerra em ${campaignContext.timeLeft}`}
          title={campaignContext.title}
          copy={campaignContext.rule}
        />
        {club ? (
          <CampaignExperience club={club} />
        ) : (
          <Surface className="empty-state">
            <p className="eyebrow">Escolha um clube</p>
            <h2>Abra a campanha com o contexto do seu clube.</h2>
            <p>A leitura completa da disputa aparece quando a campanha entra pelo clube ativo.</p>
          </Surface>
        )}
      </div>
    </AppShell>
  );
}
