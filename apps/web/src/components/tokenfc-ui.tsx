import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { ActivityItem, CampaignArt, Club, Product } from "@/lib/data";
import { formatNumber, formatTfc } from "@/lib/data";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clubTheme(club: Club): CSSProperties {
  return {
    "--club-accent": club.accent,
    "--club-accent-soft": club.accentSoft,
    "--club-dark": club.dark,
    "--club-glow": club.glow,
  } as CSSProperties;
}

function activityStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("confirm")) {
    return "success";
  }

  if (normalized.includes("liberado")) {
    return "context";
  }

  if (normalized.includes("ativo")) {
    return "neutral";
  }

  return "neutral";
}

export function TokenWordmark() {
  return (
    <Link className="wordmark" href="/">
      <span className="wordmark-mark">T</span>
      <span className="wordmark-copy">
        <strong>Token F.C.</strong>
      </span>
    </Link>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link className={cn("button", `button-${variant}`, className)} href={href}>
      {children}
    </Link>
  );
}

export function GoogleIdentityPill() {
  return (
    <div className="identity-pill" aria-label="Conta Google conectada">
      <span className="identity-pill-avatar">G</span>
      <span className="identity-pill-copy">
        <small>Google</small>
        <strong>Conta conectada</strong>
      </span>
    </div>
  );
}

export function Surface({
  className,
  children,
  tone = "light",
  style,
}: {
  className?: string;
  children: ReactNode;
  tone?: "light" | "dark" | "accent";
  style?: CSSProperties;
}) {
  return (
    <section
      className={cn(
        "surface",
        tone === "dark" && "surface-dark",
        tone === "accent" && "surface-accent",
        className,
      )}
      style={style}
    >
      {children}
    </section>
  );
}

export function PageIntro({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("page-intro", align === "center" && "page-intro-center")}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  );
}

export function BalanceCapsule({
  balance,
  href,
}: {
  balance: number;
  href?: string;
}) {
  const content = <strong>{formatTfc(balance)}</strong>;

  if (href) {
    return (
      <Link className="balance-capsule balance-capsule-action" href={href}>
        {content}
      </Link>
    );
  }

  return <div className="balance-capsule">{content}</div>;
}

export function ClubCrest({
  club,
  size = "medium",
}: {
  club: Club;
  size?: "small" | "medium" | "large";
}) {
  return (
    <div className={cn("club-crest", `club-crest-${size}`)} style={clubTheme(club)}>
      <div className="club-crest-ring">
        <span>{club.initials}</span>
      </div>
    </div>
  );
}

export function JerseyArtwork({
  club,
  className,
}: {
  club: Club;
  className?: string;
}) {
  const [base, accent, trim] = club.jerseyColors;

  return (
    <div className={cn("jersey-frame", className)} style={clubTheme(club)}>
      <svg
        aria-hidden="true"
        className="jersey-artwork"
        viewBox="0 0 280 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`shirt-gradient-${club.slug}`} x1="0%" x2="100%">
            <stop offset="0%" stopColor={base} />
            <stop offset="100%" stopColor={trim} />
          </linearGradient>
        </defs>
        <path
          d="M84 42L112 24h56l28 18 36 22-24 54-32-16v182H104V102L72 118 48 64l36-22Z"
          fill={`url(#shirt-gradient-${club.slug})`}
          stroke={club.dark}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {club.jerseyPattern === "halves" ? (
          <path
            d="M140 24h28l28 18 36 22-24 54-32-16v182h-36V24Z"
            fill={accent}
            opacity="0.92"
          />
        ) : null}
        {club.jerseyPattern === "stripes" ? (
          <>
            <rect x="104" y="28" width="18" height="256" fill={accent} opacity="0.95" />
            <rect x="140" y="24" width="18" height="260" fill={accent} opacity="0.95" />
            <rect x="176" y="38" width="18" height="246" fill={accent} opacity="0.95" />
          </>
        ) : null}
        {club.jerseyPattern === "band" ? (
          <rect x="88" y="108" width="104" height="44" fill={accent} opacity="0.96" rx="14" />
        ) : null}
        {club.jerseyPattern === "sash" ? (
          <path
            d="M92 74 114 46l102 132-20 26L92 74Z"
            fill={accent}
            opacity="0.95"
          />
        ) : null}
        <circle cx="140" cy="78" r="18" fill={club.dark} />
        <circle cx="140" cy="78" r="12" fill={trim} opacity="0.8" />
        <rect x="116" y="154" width="48" height="14" rx="7" fill={club.dark} opacity="0.14" />
        <rect x="108" y="184" width="64" height="10" rx="5" fill={club.dark} opacity="0.08" />
      </svg>
    </div>
  );
}

export function LiveMetricCapsule({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="live-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{meta}</p>
    </div>
  );
}

export function RankingRibbon({
  title,
  items,
  kind = "default",
}: {
  title: string;
  items: Array<{ club: string; value: number }>;
  kind?: "default" | "tfc";
}) {
  return (
    <Surface className="ranking-ribbon">
      <div className="section-heading">
        <p>{title}</p>
      </div>
      <div className="ranking-ribbon-track">
        {items.map((item, index) => (
          <article className="ranking-chip" key={`${title}-${item.club}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.club}</strong>
            <p>{kind === "tfc" ? formatTfc(item.value) : formatNumber(item.value)}</p>
          </article>
        ))}
      </div>
    </Surface>
  );
}

export function ClubHero({
  club,
  balance,
  title,
  copy,
  ctaHref,
  ctaLabel,
  context,
}: {
  club: Club;
  balance: number;
  title: string;
  copy: string;
  ctaHref: string;
  ctaLabel: string;
  context: Array<{ label: string; value: string }>;
}) {
  return (
    <Surface className="club-hero" tone="dark" style={clubTheme(club)}>
      <div className="club-hero-grid">
        <div className="club-hero-copy">
          <div className="hero-context">
            <ClubCrest club={club} size="small" />
            <div>
              <p className="eyebrow">{club.name}</p>
              <span>{club.story}</span>
            </div>
          </div>
          <h1>{title}</h1>
          <p>{copy}</p>
          <div className="hero-actions">
            <LinkButton href={ctaHref}>{ctaLabel}</LinkButton>
            <BalanceCapsule balance={balance} />
          </div>
        </div>
        <div className="club-hero-stage">
          <JerseyArtwork className="club-hero-jersey" club={club} />
          <div className="club-hero-metrics">
            {context.map((item) => (
              <div className="hero-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Surface>
  );
}

export function RankPulsePanel({
  label,
  value,
  detail,
  note,
  variant = "ranking",
}: {
  label: string;
  value: string;
  detail: string;
  note: string;
  variant?: "ranking" | "utility";
}) {
  return (
    <Surface
      className={cn(
        "rank-pulse-panel",
        variant === "utility" && "rank-pulse-panel-utility",
      )}
    >
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
      <small>{note}</small>
    </Surface>
  );
}

export function CampaignFocusStage({
  club,
  art,
}: {
  club: Club;
  art: CampaignArt;
}) {
  return (
    <Surface className="campaign-stage" tone="accent" style={clubTheme(club)}>
      <div className="campaign-stage-copy">
        <p className="eyebrow">Campanha da camisa</p>
        <h2>{art.name}</h2>
        <p>{art.summary}</p>
        <div className="campaign-stage-stats">
          <div>
            <span>Apoiadores</span>
            <strong>{formatNumber(art.supporters)}</strong>
          </div>
          <div>
            <span>Total comprometido</span>
            <strong>{formatTfc(art.totalTfc)}</strong>
          </div>
          <div>
            <span>Criador</span>
            <strong>{art.creator}</strong>
          </div>
        </div>
      </div>
      <div
        className="campaign-stage-art"
        style={{
          background: `linear-gradient(140deg, ${art.gradient[0]}, ${art.gradient[1]})`,
        }}
      >
        <JerseyArtwork club={club} />
      </div>
    </Surface>
  );
}

export function ClubPlate({
  club,
  selected = false,
  onClick,
}: {
  club: Club;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <article
      className={cn("club-plate", selected && "club-plate-selected")}
      style={clubTheme(club)}
    >
      <div className="club-plate-head">
        <ClubCrest club={club} size="small" />
        <div>
          <h3>{club.name}</h3>
          <p>{club.city}</p>
        </div>
      </div>
      <div className="club-plate-body">
        <div>
          <span>Maior Torcida</span>
          <strong>#{club.supporterRank}</strong>
        </div>
        <div>
          <span>Torcida Mais Forte</span>
          <strong>#{club.strongestFansRank}</strong>
        </div>
        <div>
          <span>Movimento atual</span>
          <strong>{formatTfc(club.strongestFansTfc)}</strong>
        </div>
      </div>
      <JerseyArtwork className="club-plate-jersey" club={club} />
    </article>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button className="club-plate-button" onClick={onClick} type="button">
      {content}
    </button>
  );
}

export function ActivationStepper({
  steps,
}: {
  steps: Array<{ label: string; detail: string; state: "done" | "active" | "idle" }>;
}) {
  return (
    <div className="activation-stepper">
      {steps.map((step, index) => (
        <div className="activation-step" key={step.label}>
          <div className={cn("activation-dot", `activation-dot-${step.state}`)}>
            {index + 1}
          </div>
          <div>
            <strong>{step.label}</strong>
            <p>{step.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductSpotlightCard({
  product,
  club,
  href,
}: {
  product: Product;
  club: Club;
  href: string;
}) {
  return (
    <Surface className="product-spotlight" style={clubTheme(club)}>
      <div className="product-spotlight-copy">
        <p className="eyebrow">{product.emphasis}</p>
        <h3>{product.name}</h3>
        <p>{product.note}</p>
        <div className="product-spotlight-footer">
          <strong>{formatTfc(product.price)}</strong>
          <LinkButton href={href} variant="secondary">
            Ir para checkout
          </LinkButton>
        </div>
      </div>
      <div className="product-object">
        <JerseyArtwork club={club} />
      </div>
    </Surface>
  );
}

export function CheckoutLedgerSummary({
  title,
  amount,
  detail,
  afterBalance,
}: {
  title: string;
  amount: number;
  detail: string;
  afterBalance: number;
}) {
  return (
    <Surface className="checkout-ledger-summary">
      <div>
        <p className="eyebrow">{title}</p>
        <h2>{formatTfc(amount)}</h2>
        <p>{detail}</p>
      </div>
        <div className="checkout-ledger-grid">
          <div>
            <span>Produto</span>
            <strong>{formatTfc(amount)}</strong>
          </div>
          <div>
            <span>Taxas</span>
            <strong>{formatTfc(0)}</strong>
          </div>
          <div>
            <span>Saldo apos compra</span>
            <strong>{formatTfc(afterBalance)}</strong>
        </div>
      </div>
    </Surface>
  );
}

export function ActivityLedgerTimeline({
  items,
}: {
  items: ActivityItem[];
}) {
  return (
    <div className="activity-ledger">
      {items.map((item) => {
        const tone = activityStatusTone(item.status);

        return (
        <article
          className={cn("activity-item", `activity-item-${tone}`)}
          key={`${item.time}-${item.title}`}
        >
          <div className="activity-item-rail" />
          <div className="activity-item-copy">
            <p>{item.time}</p>
            <h3>{item.title}</h3>
            <span>{item.detail}</span>
          </div>
          <div className="activity-item-meta">
            <strong>{item.amount}</strong>
            <small className={cn("activity-item-status", `activity-item-status-${tone}`)}>
              {item.status}
            </small>
          </div>
        </article>
        );
      })}
    </div>
  );
}

export function EditorialStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="editorial-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
