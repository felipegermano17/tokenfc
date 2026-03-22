"use client";

import { useTokenFcSession } from "@/components/app-providers";
import {
  ActivityLedgerTimeline,
  Surface,
} from "@/components/tokenfc-ui";
import { activityFeed, formatTfc } from "@/lib/data";

export function ActivityExperience() {
  const { state } = useTokenFcSession();
  const activitySummary = state?.activitySummary;
  const items = state?.activity?.length ? state.activity : activityFeed;

  return (
    <div className="modal-stack">
      <Surface className="activity-summary">
        <div className="section-heading">
          <p>Resumo do ciclo</p>
          <span>O que mais pesa agora na sua conta</span>
        </div>
        <div className="credit-flow-ledger">
          <div>
            <span>Saldo atual</span>
            <strong>{formatTfc(Number(activitySummary?.currentBalanceTfcRaw ?? "22"))}</strong>
          </div>
          <div>
            <span>Ultimo apoio</span>
            <strong>{formatTfc(Number(activitySummary?.lastSupportTfcRaw ?? "10"))}</strong>
          </div>
          <div>
            <span>Ultima compra</span>
            <strong>{formatTfc(Number(activitySummary?.lastOrderTfcRaw ?? "40"))}</strong>
          </div>
        </div>
      </Surface>

      <Surface className="activity-page-surface">
        <div className="section-heading">
          <p>Linha do tempo</p>
          <span>Ultimos movimentos confirmados</span>
        </div>
        <ActivityLedgerTimeline items={items} />
      </Surface>
    </div>
  );
}
