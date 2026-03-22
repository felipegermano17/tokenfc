export type Club = {
  slug: string;
  name: string;
  shortName: string;
  initials: string;
  city: string;
  largestSupporters: number;
  strongestFansRank: number;
  strongestFansTfc: number;
  supporterRank: number;
  accent: string;
  accentSoft: string;
  dark: string;
  glow: string;
  aliases: string[];
  story: string;
  jerseyPattern: "halves" | "stripes" | "band" | "sash";
  jerseyColors: string[];
};

export type CampaignArt = {
  id: string;
  name: string;
  creator: string;
  supporters: number;
  totalTfc: number;
  summary: string;
  gradient: [string, string];
};

export type Product = {
  id: string;
  name: string;
  price: number;
  note: string;
  emphasis: string;
};

export type ActivityItem = {
  title: string;
  detail: string;
  amount: string;
  status: string;
  time: string;
};

export const clubs: Club[] = [
  {
    slug: "corinthians",
    name: "Corinthians",
    shortName: "Timao",
    initials: "SCCP",
    city: "Sao Paulo",
    largestSupporters: 1180,
    strongestFansRank: 1,
    strongestFansTfc: 18400,
    supporterRank: 2,
    accent: "#111111",
    accentSoft: "#e7e9ec",
    dark: "#0f141a",
    glow: "#f5f7fa",
    aliases: ["corinthians", "timao", "sccp", "corinthians paulista"],
    story: "Campanha forte, leitura direta e uma torcida que ganha peso dentro do ecossistema.",
    jerseyPattern: "halves",
    jerseyColors: ["#f5f7fa", "#111111", "#d9dde2"],
  },
  {
    slug: "flamengo",
    name: "Flamengo",
    shortName: "Fla",
    initials: "CRF",
    city: "Rio de Janeiro",
    largestSupporters: 1240,
    strongestFansRank: 2,
    strongestFansTfc: 17250,
    supporterRank: 1,
    accent: "#c81d25",
    accentSoft: "#fde7e9",
    dark: "#121317",
    glow: "#f7f8fa",
    aliases: ["flamengo", "fla", "mengao", "crf"],
    story: "Escala de torcida alta, presenca de massa e forca economica sempre na disputa.",
    jerseyPattern: "stripes",
    jerseyColors: ["#141519", "#c81d25", "#f4f6f8"],
  },
  {
    slug: "palmeiras",
    name: "Palmeiras",
    shortName: "Verdao",
    initials: "SEP",
    city: "Sao Paulo",
    largestSupporters: 980,
    strongestFansRank: 3,
    strongestFansTfc: 15980,
    supporterRank: 4,
    accent: "#0f6a44",
    accentSoft: "#ddf1e7",
    dark: "#0f1713",
    glow: "#eff8f3",
    aliases: ["palmeiras", "verdao", "sep"],
    story: "Organizacao forte, movimento consistente e uma identidade que segura o jogo sem excesso.",
    jerseyPattern: "band",
    jerseyColors: ["#eef3ef", "#0f6a44", "#f5f7fa"],
  },
  {
    slug: "sao-paulo",
    name: "Sao Paulo",
    shortName: "Tricolor",
    initials: "SPFC",
    city: "Sao Paulo",
    largestSupporters: 1010,
    strongestFansRank: 4,
    strongestFansTfc: 14430,
    supporterRank: 3,
    accent: "#d62839",
    accentSoft: "#fbe3e6",
    dark: "#13161b",
    glow: "#f7f8fa",
    aliases: ["sao paulo", "sao-paulo", "tricolor", "spfc"],
    story: "Presenca competitiva, campanha viva e um clube que entra para disputar espaco real.",
    jerseyPattern: "sash",
    jerseyColors: ["#f6f7f9", "#1b1b1d", "#d62839"],
  },
];

export const clubRankings = {
  biggest: [
    { club: "Flamengo", value: 1240 },
    { club: "Corinthians", value: 1180 },
    { club: "Sao Paulo", value: 1010 },
    { club: "Palmeiras", value: 980 },
  ],
  strongest: [
    { club: "Corinthians", value: 18400 },
    { club: "Flamengo", value: 17250 },
    { club: "Palmeiras", value: 15980 },
    { club: "Sao Paulo", value: 14430 },
  ],
};

export const contestArts: CampaignArt[] = [
  {
    id: "arte-01",
    name: "Arte #01",
    creator: "@torcedor01",
    supporters: 148,
    totalTfc: 2340,
    summary: "Faixas limpas, leitura forte no peito e uma composicao que funciona dentro e fora do estadio.",
    gradient: ["#dfe8f0", "#9fb1c2"],
  },
  {
    id: "arte-02",
    name: "Arte #02",
    creator: "@torcedor77",
    supporters: 121,
    totalTfc: 2120,
    summary: "Contraste mais agressivo, ombros marcados e uma assinatura visual mais direta.",
    gradient: ["#eef1f5", "#c5ced8"],
  },
  {
    id: "arte-03",
    name: "Arte #03",
    creator: "@arquivo1910",
    supporters: 89,
    totalTfc: 1730,
    summary: "Bloco escuro, linhas secas e uma leitura mais noturna para jogo grande.",
    gradient: ["#dde2e8", "#8c98a5"],
  },
];

export const topupOptions = [20, 50, 100];

export const products: Product[] = [
  {
    id: "camisa-comemorativa",
    name: "Camisa comemorativa vencedora",
    price: 40,
    note: "Peca central da campanha e da utilidade do TFC dentro da loja do clube.",
    emphasis: "Destaque",
  },
  {
    id: "patch-campanha",
    name: "Patch da campanha 2026",
    price: 15,
    note: "Item leve para quem quer registrar a edicao atual da votacao da camisa.",
    emphasis: "Acessorio",
  },
  {
    id: "faixa-torcida",
    name: "Faixa da torcida",
    price: 25,
    note: "Produto de estadio com presenca visual clara e leitura oficial.",
    emphasis: "Jogo",
  },
];

export const activityFeed: ActivityItem[] = [
  {
    title: "Compra concluida",
    detail: "Camisa comemorativa",
    amount: "$40 TFC",
    status: "Concluido",
    time: "Hoje 15:42",
  },
  {
    title: "Apoio confirmado",
    detail: "Arte #01",
    amount: "$10 TFC",
    status: "Confirmado",
    time: "Hoje 15:20",
  },
  {
    title: "Credito liberado",
    detail: "PIX confirmado",
    amount: "$50 TFC",
    status: "Saldo liberado",
    time: "Hoje 15:10",
  },
  {
    title: "Perfil ativado",
    detail: "ClubPass + saldo inicial",
    amount: "$1 TFC",
    status: "Ativo",
    time: "Hoje 15:05",
  },
];

export const defaultContestArt = contestArts[0]!;
export const defaultProduct = products[0]!;
export const defaultActivityItem = activityFeed[0]!;

export const appBalance = {
  onboarding: 1,
  main: 12,
  afterTopup: 62,
  afterPurchase: 22,
};

export const campaignContext = {
  title: "Escolha da proxima camisa da torcida",
  heroTitle: "A camisa de 2026 esta em disputa",
  heroSupport:
    "A torcida decide qual arte avanca liderando em TFC comprometido.",
  contestSlug: "camisa-2026",
  timeLeft: "02d 14h",
  currentLeader: "Arte #01",
  warning: "Depois da confirmacao, voce so pode aumentar o apoio na mesma arte.",
  rule: "Escolha uma arte, defina o valor em TFC e confirme sua participacao nesta campanha.",
};

export const landingCopy = {
  eyebrow: "Token F.C.",
  headline: "O token que transforma torcida em economia",
  subheadline:
    "Com TFC, o torcedor participa e compra dentro do clube. Entre com PIX, receba TFC e use o token no ecossistema oficial.",
  primaryCta: "Entrar no ecossistema",
  secondaryCta: "Ver ranking",
};

export const editorialSteps = [
  {
    overline: "Maior Torcida",
    title: "Volume de torcedores dentro da plataforma",
    copy: "Cada novo perfil fortalece a presenca do clube no ranking geral do Token F.C.",
  },
  {
    overline: "Torcida Mais Forte",
    title: "Forca economica validada pelo uso de TFC",
    copy: "Topup, apoio em campanha e compra contam para mostrar quem realmente move o ecossistema.",
  },
  {
    overline: "Campanha + Loja",
    title: "Participacao que continua depois do voto",
    copy: "A mesma conta acompanha a disputa da camisa, o saldo disponivel e a utilidade do token na compra.",
  },
];

export function getClubBySlug(slug: string) {
  return clubs.find((club) => club.slug === slug);
}

export function getContestArtById(id: string) {
  return contestArts.find((art) => art.id === id);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatTfc(value: number) {
  return `$${formatNumber(value)} TFC`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
