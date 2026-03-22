import { AppShell } from "@/components/app-shell";
import { LinkButton, PageIntro, ProductSpotlightCard, Surface } from "@/components/tokenfc-ui";
import { appBalance, defaultProduct, products } from "@/lib/data";
import { resolveActiveClub } from "@/lib/club-routing";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; product?: string }>;
}) {
  const params = await searchParams;
  const activeClub = resolveActiveClub(undefined, params.club);

  return (
    <AppShell activeClub={activeClub} balance={appBalance.afterTopup}>
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
            href={`/shop/checkout?club=${activeClub.slug}&product=${defaultProduct.id}`}
            product={defaultProduct}
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
            <p>Mais itens do clube</p>
            <span>Itens liberados nesta janela</span>
          </div>
          <div className="credit-flow-ledger">
            {products.slice(1).map((product) => (
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
        </Surface>
      </div>
    </AppShell>
  );
}
