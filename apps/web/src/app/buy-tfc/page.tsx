import { AppShell } from "@/components/app-shell";
import { CreditFlowPanel } from "@/components/credit-flow-panel";
import { PageIntro } from "@/components/tokenfc-ui";
import { resolveActiveClub } from "@/lib/club-routing";

export default async function BuyTfcPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const params = await searchParams;
  const activeClub = resolveActiveClub(undefined, params.club);

  return (
    <AppShell activeClub={activeClub} balance={0}>
      <div className="stack-2xl">
        <PageIntro
          eyebrow="Saldo e credito"
          title="Adicionar TFC"
          copy="Escolha quanto deseja creditar para apoiar campanhas e comprar no ecossistema."
        />
        <CreditFlowPanel />
      </div>
    </AppShell>
  );
}
