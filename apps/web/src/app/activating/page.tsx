import { ActivationExperience } from "@/components/activation-experience";

export default async function ActivatingPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; auth?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="simple-flow-page simple-flow-dark simple-flow-page-activation">
      <main className="shell-width flow-main flow-main-activation-noheader">
        <ActivationExperience authProvider={params.auth} clubSlug={params.club} />
      </main>
    </div>
  );
}
