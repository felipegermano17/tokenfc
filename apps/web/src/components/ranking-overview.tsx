"use client";

import { useState } from "react";
import { clubRankings, formatNumber, formatTfc } from "@/lib/data";

type RankingKey = "biggest" | "strongest";

const rankingTabs: Array<{
  key: RankingKey;
  label: string;
  helper: string;
}> = [
  {
    key: "biggest",
    label: "Maior Torcida",
    helper: "Quantidade de perfis no ecossistema",
  },
  {
    key: "strongest",
    label: "Torcida Mais Forte",
    helper: "TFC movimentado dentro do produto",
  },
];

export function RankingOverview() {
  const [activeTab, setActiveTab] = useState<RankingKey>("biggest");

  return (
    <div className="ranking-sheet-panel">
      <div className="ranking-sheet-tabs" role="tablist" aria-label="Visoes do ranking geral">
        {rankingTabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.key}
            className={
              activeTab === tab.key
                ? "ranking-sheet-tab ranking-sheet-tab-active"
                : "ranking-sheet-tab"
            }
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ranking-sheet-grid" data-active={activeTab}>
        <section className="ranking-board ranking-board-biggest">
          <div className="section-heading">
            <p>Maior Torcida</p>
            <span>Perfis vinculados ao clube</span>
          </div>
          <div className="ranking-board-list">
            {clubRankings.biggest.map((item, index) => (
              <article
                className={
                  index === 0
                    ? "ranking-board-row ranking-board-row-leader"
                    : "ranking-board-row"
                }
                key={`biggest-${item.club}`}
              >
                <span className="ranking-board-position">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="ranking-board-copy">
                  <strong>{item.club}</strong>
                  <small>{formatNumber(item.value)} perfis ativos</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ranking-board ranking-board-strongest">
          <div className="section-heading">
            <p>Torcida Mais Forte</p>
            <span>TFC validado no ecossistema</span>
          </div>
          <div className="ranking-board-list">
            {clubRankings.strongest.map((item, index) => (
              <article
                className={
                  index === 0
                    ? "ranking-board-row ranking-board-row-leader"
                    : "ranking-board-row"
                }
                key={`strongest-${item.club}`}
              >
                <span className="ranking-board-position">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="ranking-board-copy">
                  <strong>{item.club}</strong>
                  <small>{formatTfc(item.value)} em movimento</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
