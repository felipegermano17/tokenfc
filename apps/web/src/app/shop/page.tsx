import { AppShell } from "@/components/app-shell";
import { LinkButton, PageIntro, ProductSpotlightCard, Surface } from "@/components/tokenfc-ui";
import { defaultProduct, products } from "@/lib/data";
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
  const additionalProducts =
    hasLiveCatalog && liveProducts && liveProducts.length > 1
      ? liveProducts.slice(1)
      : dashboard
        ? []
        : products.slice(1);

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

        {activeClub && hasLiveCatalog ? (
          <ProductSpotlightCard
            club={activeClub}
            href={`/shop/checkout?club=${activeClub.slug}&product=${spotlightProduct.id}`}
            product={spotlightProduct}
          />
        ) : activeClub && dashboard ? (
          <Surface className="shop-support">
            <div className="section-heading">
              <p>Catalogo do clube</p>
              <span>Nenhum item liberado agora</span>
            </div>
            <p>
              Quando um produto entrar no ar para este clube, ele aparece aqui no mesmo fluxo da compra.
            </p>
          </Surface>
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
            <p>Mais itens do clube</p>
            <span>Itens liberados nesta janela</span>
          </div>
          {additionalProducts.length ? (
            <div className="credit-flow-ledger">
              {additionalProducts.map((product) => (
                <div key={product.id}>
                  <span>{product.emphasis}</span>
                  <strong>{product.name}</strong>
                  <p>{product.note}</p>
                  {activeClub ? (
                    <LinkButton href={`/shop/checkout?club=${activeClub.slug}&product=${product.id}`} variant="secondary">
                      {product.price} TFC
                    </LinkButton>
                  ) : (
                    <strong>{product.price} TFC</strong>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Nao ha outros itens liberados para este clube agora.</p>
          )}
        </Surface>
      </div>
    </AppShell>
  );
}
