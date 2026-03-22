"use client";

import { useMemo, useState } from "react";
import type { ClubDashboardShopProduct } from "@/lib/api";
import { useAuthRuntime, useTokenFcSession } from "@/components/app-providers";
import {
  appBalance,
  defaultProduct,
  formatTfc,
  getProductById,
} from "@/lib/data";
import { CheckoutLedgerSummary, Surface } from "@/components/tokenfc-ui";
import { normalizeTfcNumber } from "@/lib/tfc";

export function CheckoutExperience({
  product,
  productId,
}: {
  product?: ClubDashboardShopProduct | null;
  productId?: string;
}) {
  const { privyEnabled } = useAuthRuntime();

  if (!privyEnabled || product === undefined) {
    return <LocalCheckoutExperience productId={productId} />;
  }

  if (product === null) {
    return <EmptyCheckoutExperience />;
  }

  return <LiveCheckoutExperience product={product} />;
}

function LiveCheckoutExperience({
  product,
}: {
  product: ClubDashboardShopProduct;
}) {
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const { authenticated, checkoutProduct, state } = useTokenFcSession();
  const amount = safeNumber(product.priceTfcRaw, defaultProduct.price);
  const currentBalance = safeNumber(state?.balanceTfcRaw, 0);
  const afterBalance = useMemo(
    () => Math.max(currentBalance - amount, 0),
    [amount, currentBalance],
  );
  const confirmDisabled =
    status === "processing" ||
    (authenticated && Boolean(state?.membership) && currentBalance < amount);

  async function handleCheckout() {
    if (!authenticated) {
      setError("Acesse sua conta antes de concluir a compra.");
      return;
    }

    if (!state?.membership) {
      setError("Defina seu clube antes de concluir uma compra.");
      return;
    }

    if (currentBalance < amount) {
      setError("Seu saldo atual nao cobre esta compra.");
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      const payload = await checkoutProduct(product.id);
      setStatus(payload.order.customerStatus === "completed" ? "done" : "processing");
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel concluir a compra agora.",
      );
    }
  }

  return (
    <CheckoutCanvas
      afterBalance={afterBalance}
      amount={amount}
      currentBalance={currentBalance}
      detail={`Revise ${product.name.toLowerCase()} antes de concluir o pagamento com TFC.`}
      error={error}
      onCheckout={() => void handleCheckout()}
      productName={product.name}
      productNote="Produto ativo conectado ao catalogo seedado da demo."
      confirmDisabled={confirmDisabled}
      status={status}
    />
  );
}

function LocalCheckoutExperience({ productId }: { productId?: string }) {
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const product = getProductById(productId ?? "") ?? defaultProduct;

  function handleCheckout() {
    setStatus("processing");
    window.setTimeout(() => setStatus("done"), 1200);
  }

  return (
    <CheckoutCanvas
      afterBalance={appBalance.afterPurchase}
      amount={product.price}
      currentBalance={appBalance.afterTopup}
      detail={`Revise ${product.name.toLowerCase()} antes de concluir o pagamento com TFC.`}
      error={null}
      onCheckout={handleCheckout}
      productName={product.name}
      productNote={product.note}
      status={status}
    />
  );
}

function EmptyCheckoutExperience() {
  return (
    <div className="checkout-layout">
      <Surface className="checkout-block" tone="dark">
        <p className="eyebrow">Pagamento</p>
        <h2>Nenhum produto ativo neste clube agora.</h2>
        <p>
          Quando um item estiver liberado para compra, o pedido e o saldo final
          aparecem aqui no mesmo fluxo do checkout.
        </p>
      </Surface>
    </div>
  );
}

function CheckoutCanvas({
  afterBalance,
  amount,
  currentBalance,
  detail,
  error,
  onCheckout,
  confirmDisabled,
  productName,
  productNote,
  status,
}: {
  afterBalance: number;
  amount: number;
  currentBalance: number;
  detail: string;
  error: string | null;
  onCheckout: () => void;
  confirmDisabled?: boolean;
  productName: string;
  productNote: string;
  status: "idle" | "processing" | "done";
}) {
  return (
    <div className="checkout-layout">
      <CheckoutLedgerSummary
        afterBalance={afterBalance}
        amount={amount}
        detail={detail}
        title="Confirmar pedido"
      />

      <div className="checkout-grid">
        <Surface className="checkout-block" tone="dark">
          <p className="eyebrow">Pagamento</p>
          <h2>Revise o saldo e confirme o pedido.</h2>
          <p>
            Tudo o que sai da conta aparece aqui: item, valor total e saldo final
            apos a compra.
          </p>
          {error ? (
            <p className="eyebrow" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className={
              status === "done"
                ? "button button-primary button-success"
                : "button button-primary"
            }
            disabled={confirmDisabled ?? status === "processing"}
            onClick={onCheckout}
            type="button"
          >
            {status === "processing"
              ? "Confirmando compra..."
              : status === "done"
                ? "Compra confirmada"
                : "Confirmar compra"}
          </button>
          <small className="quiet-copy">
            Saldo atual: {formatTfc(currentBalance)}. Saldo apos compra: {formatTfc(afterBalance)}.
          </small>
        </Surface>

        <Surface className="checkout-block">
          <p className="eyebrow">Pedido</p>
          <h2>{productName}</h2>
          <p>{productNote}</p>
          <div className="checkout-list">
            <div>
              <span>Pagamento</span>
              <strong>100% com TFC</strong>
            </div>
            <div>
              <span>Entrega</span>
              <strong>Confirmada apos o pagamento</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>
                {status === "done"
                  ? "Pedido confirmado"
                  : status === "processing"
                    ? "Confirmando pedido"
                    : "Aguardando confirmacao"}
              </strong>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function safeNumber(value: string | undefined, fallback: number) {
  return normalizeTfcNumber(value, fallback);
}
