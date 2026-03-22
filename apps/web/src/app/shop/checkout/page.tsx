import { AppShell } from "@/components/app-shell";
import { CheckoutExperience } from "@/components/checkout-experience";
import { getClubDashboard } from "@/lib/api";
import { resolveActiveClub } from "@/lib/club-routing";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; product?: string }>;
}) {
  const params = await searchParams;
  const activeClub = resolveActiveClub(undefined, params.club);
  const dashboard = activeClub ? await getClubDashboard(activeClub.slug) : null;
  const selectedProduct = dashboard
    ? dashboard.shopProducts.find(
        (product) => product.id === params.product || product.sku === params.product,
      ) ??
      dashboard.shopProducts[0] ??
      null
    : undefined;

  return (
    <AppShell activeClub={activeClub} balance={0}>
      <CheckoutExperience product={selectedProduct} productId={params.product} />
    </AppShell>
  );
}
