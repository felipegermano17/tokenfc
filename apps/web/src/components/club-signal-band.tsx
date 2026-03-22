"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useTokenFcSession } from "@/components/app-providers";
import type { Club } from "@/lib/data";
import { formatNumber, formatTfc } from "@/lib/data";
import { normalizeTfcNumber } from "@/lib/tfc";

function clubSignalTheme(club: Club): CSSProperties {
  return {
    "--club-accent": club.accent,
    "--club-accent-soft": club.accentSoft,
    "--club-dark": club.dark,
    "--club-glow": club.glow,
  } as CSSProperties;
}

export function ClubSignalBand({
  club,
  balance,
  supportersCount,
  totalPower,
}: {
  club: Club;
  balance: number;
  supportersCount?: number;
  totalPower?: number;
}) {
  const { state } = useTokenFcSession();
  const resolvedBalance = useMemo(
    () => normalizeTfcNumber(state?.balanceTfcRaw, balance),
    [balance, state?.balanceTfcRaw],
  );
  const items = [
    {
      label: "Maior Torcida",
      value: formatNumber(supportersCount ?? club.largestSupporters),
      detail: `#${club.supporterRank} no ecossistema`,
    },
    {
      label: "Torcida Mais Forte",
      value: formatTfc(totalPower ?? club.strongestFansTfc),
      detail: `#${club.strongestFansRank} no ranking`,
    },
    {
      label: "Seu saldo",
      value: formatTfc(resolvedBalance),
      detail: "Disponivel para campanha ou compra",
    },
  ];

  return (
    <section className="club-signal-band" style={clubSignalTheme(club)}>
      {items.map((item, index) => (
        <article
          className={index === items.length - 1 ? "club-signal-item club-signal-item-balance" : "club-signal-item"}
          key={item.label}
        >
          <span className="club-signal-label">{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
