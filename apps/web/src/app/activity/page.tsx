import { AppShell } from "@/components/app-shell";
import {
  ActivityLedgerTimeline,
  PageIntro,
  Surface,
} from "@/components/tokenfc-ui";
import { activityFeed, appBalance } from "@/lib/data";
import { resolveActiveClub } from "@/lib/club-routing";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const params = await searchParams;
  const activeClub = resolveActiveClub(undefined, params.club);

  return (
    <AppShell activeClub={activeClub} balance={appBalance.afterPurchase}>
      <div className="stack-2xl">
        <PageIntro
          eyebrow="Memoria do ecossistema"
          title="Sua atividade"
          copy={
            activeClub
              ? `Tudo o que voce ativou, apoiou, creditou e comprou dentro do ${activeClub.name}.`
              : "Tudo o que voce ativou, apoiou, creditou e comprou dentro da plataforma."
          }
        />

        <Surface className="activity-summary">
          <div className="section-heading">
            <p>Resumo do ciclo recente</p>
            <span>Compras, apoio e saldo do momento</span>
          </div>
          <div className="credit-flow-ledger">
            <div>
              <span>Ultima compra</span>
              <strong>40 TFC</strong>
            </div>
            <div>
              <span>Apoio confirmado</span>
              <strong>10 TFC</strong>
            </div>
            <div>
              <span>Saldo atual</span>
              <strong>22 TFC</strong>
            </div>
          </div>
        </Surface>

        <Surface className="activity-page-surface">
          <div className="section-heading">
            <p>Linha do tempo</p>
            <span>Ultimos movimentos da conta e da campanha</span>
          </div>
          <ActivityLedgerTimeline items={activityFeed} />
        </Surface>
      </div>
    </AppShell>
  );
}
