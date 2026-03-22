import { AppShell } from "@/components/app-shell";
import { PageIntro, ProductSpotlightCard, Surface } from "@/components/tokenfc-ui";
import { defaultProduct } from "@/lib/data";
import { getClubDashboard } from "@/lib/api";
import { resolveActiveClub } from "@/lib/club-routing";
import { normalizeTfcNumber } from "@/lib/tfc";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; product?: string }>;
}) {
  const params = await searchParams;
  const activeClub = resolveActiveClub(undefined, params.club);
  const dashboard = activeClub ? await getClubDashboard(activeClub.slug) : null;
  const liveProducts = dashboard?.shopProducts.map((product, index) => ({
    emphasis: index === 0 ? "Destaque" : "Catalogo",
    id: product.id,
    name: product.name,
    note: "Produto ativo conectado ao catalogo seedado da demo.",
    price: normalizeTfcNumber(product.priceTfcRaw),
  }));
  const hasLiveCatalog = Boolean(dashboard && dashboard.shopProducts.length > 0);
  const spotlightProduct = hasLiveCatalog ? liveProducts?.[0] ?? defaultProduct : defaultProduct;
  const checkoutHref = activeClub
    ? `/shop/checkout?club=${activeClub.slug}&product=${spotlightProduct.id}`
    : undefined;

  return (
    <AppShell activeClub={activeClub} balance={0}>
      <div className="stack-2xl">
        <PageIntro
          eyebrow="Loja oficial"
          title={
            activeClub
              ? `Produtos e experiencias do ${activeClub.name}`
              : "Produtos e experiencias dentro do ecossistema"
          }
          copy={
            activeClub
              ? "O TFC entra aqui como utilidade concreta dentro da rotina do clube."
              : "Escolha um clube para ver produtos, campanha e saldo dentro do mesmo contexto."
          }
        />

        {activeClub ? (
          <ProductSpotlightCard
            club={activeClub}
            href={checkoutHref ?? "/shop"}
            product={spotlightProduct}
          />
        ) : (
          <Surface className="shop-support">
            <div className="section-heading">
              <p>Escolha um clube</p>
              <span>Abra a loja a partir da sua identidade</span>
            </div>
            <p>
              Entre pela escolha do clube para abrir a loja com campanha, saldo e produtos no mesmo fluxo.
            </p>
          </Surface>
        )}

        <Surface className="shop-support">
          <div className="section-heading">
            <p>Item liberado agora</p>
            <span>Uma unica compra para manter a demo direta</span>
          </div>
          <p>Esta demo deixa uma unica camisa em destaque para simplificar a jornada de compra.</p>
        </Surface>
      </div>
    </AppShell>
  );
}
