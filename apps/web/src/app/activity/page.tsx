import { AppShell } from "@/components/app-shell";
import { ActivityExperience } from "@/components/activity-experience";
import { PageIntro } from "@/components/tokenfc-ui";
import { appBalance } from "@/lib/data";
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
        <ActivityExperience />
      </div>
    </AppShell>
  );
}
