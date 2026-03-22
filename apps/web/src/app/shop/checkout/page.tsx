import { AppShell } from "@/components/app-shell";
import { CheckoutExperience } from "@/components/checkout-experience";
import { appBalance } from "@/lib/data";
import { resolveActiveClub } from "@/lib/club-routing";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; product?: string }>;
}) {
  const params = await searchParams;
  const activeClub = resolveActiveClub(undefined, params.club);

  return (
    <AppShell activeClub={activeClub} balance={appBalance.afterTopup}>
      <CheckoutExperience productId={params.product} />
    </AppShell>
  );
}
