import type { CSSProperties } from "react";
import type { Club } from "@/lib/data";
import { formatNumber, formatTfc } from "@/lib/data";

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
}: {
  club: Club;
  balance: number;
}) {
  const items = [
    {
      label: "Maior Torcida",
      value: formatNumber(club.largestSupporters),
      detail: `#${club.supporterRank} no ecossistema`,
    },
    {
      label: "Torcida Mais Forte",
      value: formatTfc(club.strongestFansTfc),
      detail: `#${club.strongestFansRank} no ranking`,
    },
    {
      label: "Seu saldo",
      value: formatTfc(balance),
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
