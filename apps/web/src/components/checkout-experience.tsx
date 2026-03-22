"use client";

import { useState } from "react";
import { appBalance, defaultProduct, formatTfc, getProductById } from "@/lib/data";
import { CheckoutLedgerSummary, Surface } from "@/components/tokenfc-ui";

export function CheckoutExperience({ productId }: { productId?: string }) {
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const product = getProductById(productId ?? "") ?? defaultProduct;

  function handleCheckout() {
    setStatus("processing");
    window.setTimeout(() => setStatus("done"), 1200);
  }

  return (
    <div className="checkout-layout">
      <CheckoutLedgerSummary
        afterBalance={appBalance.afterPurchase}
        amount={product.price}
        detail={`Revise ${product.name.toLowerCase()} antes de concluir o pagamento com TFC.`}
        title="Confirmar pedido"
      />

      <div className="checkout-grid">
        <Surface className="checkout-block" tone="dark">
          <p className="eyebrow">Pagamento</p>
          <h2>Revise o saldo e confirme o pedido.</h2>
          <p>
            Tudo o que sai da conta aparece aqui: item, valor total e saldo final apos a compra.
          </p>
          <button
            className={
              status === "done"
                ? "button button-primary button-success"
                : "button button-primary"
            }
            onClick={handleCheckout}
            type="button"
          >
            {status === "processing"
              ? "Confirmando compra..."
              : status === "done"
                ? "Compra confirmada"
                : "Confirmar compra"}
          </button>
          <small className="quiet-copy">
            Saldo atual: {formatTfc(appBalance.afterTopup)}. Saldo apos compra: {formatTfc(appBalance.afterPurchase)}.
          </small>
        </Surface>

        <Surface className="checkout-block">
          <p className="eyebrow">Pedido</p>
          <h2>{product.name}</h2>
          <p>{product.note}</p>
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
              <strong>{status === "done" ? "Pedido confirmado" : "Aguardando confirmacao"}</strong>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
