import cors from "@fastify/cors";
import { PrivyClient } from "@privy-io/node";
import { prisma } from "@tokenfc/db";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";

const host = process.env.API_HOST ?? "0.0.0.0";
const port = z.coerce.number().default(4000).parse(process.env.API_PORT ?? "4000");
const privyAppId = resolveFirstEnv([
  "PRIVY_APP_ID",
  "NEXT_PUBLIC_PRIVY_APP_ID",
  "TOKENFC_PRIVY_APP_ID",
]);
const privyAppSecret = resolveFirstEnv([
  "PRIVY_APP_SECRET",
  "TOKENFC_PRIVY_APP_SECRET",
]);
const privyClient =
  privyAppId && privyAppSecret
    ? new PrivyClient({
        appId: privyAppId,
        appSecret: privyAppSecret,
      })
    : null;
const authSessionBodySchema = z.object({
  wallets: z
    .array(
      z.object({
        address: z.string().trim().min(1),
        provider: z.string().trim().min(1).optional(),
        isEmbedded: z.boolean().optional(),
      }),
    )
    .default([]),
});
const selectClubBodySchema = z.object({
  clubSlug: z.string().trim().min(1),
});

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => ({
  service: "tokenfc-api",
  ok: true,
}));

app.get("/v1/ping", async () => ({
  now: new Date().toISOString(),
  service: "tokenfc-api",
  status: "ready-for-bootstrap",
}));

app.post("/auth/session", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const body = authSessionBodySchema.parse(request.body ?? {});
  const wallets = normalizeWalletInputs(body.wallets);

  const user = await prisma.user.upsert({
    where: { privyUserId: session.user_id },
    update: {},
    create: { privyUserId: session.user_id },
  });

  if (wallets.length) {
    await prisma.$transaction(
      wallets.map((wallet) =>
        prisma.userWallet.upsert({
          where: { walletAddress: wallet.address },
          update: {
            userId: user.id,
            provider: wallet.provider,
            isEmbedded: wallet.isEmbedded,
          },
          create: {
            userId: user.id,
            walletAddress: wallet.address,
            provider: wallet.provider,
            isEmbedded: wallet.isEmbedded,
          },
        }),
      ),
    );
  }

  return {
    ok: true,
    user: {
      id: user.id,
      privyUserId: user.privyUserId,
    },
    ...(await buildAppUserState(user.id)),
  };
});

app.get("/auth/me", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const user = await prisma.user.upsert({
    where: { privyUserId: session.user_id },
    update: {},
    create: { privyUserId: session.user_id },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      privyUserId: user.privyUserId,
    },
    ...(await buildAppUserState(user.id)),
  };
});

app.post("/onboarding/select-club", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const body = selectClubBodySchema.parse(request.body ?? {});
  const club = await prisma.club.findUnique({
    where: { slug: body.clubSlug },
  });

  if (!club) {
    return reply.code(404).send({ error: "Clube nao encontrado." });
  }

  const user = await prisma.user.upsert({
    where: { privyUserId: session.user_id },
    update: {},
    create: { privyUserId: session.user_id },
  });

  const result = await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.clubMembership.findUnique({
      where: { userId: user.id },
    });

    if (existingMembership && existingMembership.clubId !== club.id) {
      return {
        kind: "locked" as const,
      };
    }

    const membership =
      existingMembership ??
      (await tx.clubMembership.create({
        data: {
          userId: user.id,
          clubId: club.id,
        },
      }));
    const primaryWallet = await tx.userWallet.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    const onboardingIntentKey = `onboarding-activation:${user.id}`;
    const ledgerEntryKey = `ledger:onboarding-activation:${user.id}`;
    const existingIntent = await tx.transactionIntent.findUnique({
      where: { idempotencyKey: onboardingIntentKey },
    });
    let welcomeGranted = false;

    if (!existingIntent) {
      const intent = await tx.transactionIntent.create({
        data: {
          userId: user.id,
          walletAddress: primaryWallet?.walletAddress ?? null,
          intentType: "onboarding_activation",
          sourceScreen: "onboarding",
          sourceAction: "select_club",
          status: "ledger_posted",
          idempotencyKey: onboardingIntentKey,
          metadata: {
            clubSlug: club.slug,
            sponsorRequired: true,
            futureChainActions: ["mint_club_pass", "grant_welcome_tfc"],
          },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: user.id,
          clubId: club.id,
          asset: "TFC",
          direction: "credit",
          amountRaw: "1",
          reason: "welcome_tfc_grant",
          sourceType: "onboarding_activation",
          sourceId: intent.id,
          transactionIntentId: intent.id,
          idempotencyKey: ledgerEntryKey,
          status: "posted",
          effectiveAt: new Date(),
        },
      });

      welcomeGranted = true;
    }

    return {
      clubSlug: club.slug,
      clubPassStatus: membership.clubPassTokenId ? "active" : "pending",
      kind: "ok" as const,
      welcomeGranted,
    };
  });

  if (result.kind === "locked") {
    return reply.code(409).send({
      error: "Seu clube ja foi definido e nao pode ser trocado nesta demo.",
    });
  }

  return {
    ok: true,
    selection: result,
    ...(await buildAppUserState(user.id)),
  };
});

app.get("/clubs/featured", async () => {
  const clubs = await prisma.club.findMany({
    where: { isFeatured: true, isActive: true },
    orderBy: { name: "asc" },
    include: {
      metrics: true,
    },
  });

  return clubs.map((club) => ({
    id: club.id.toString(),
    slug: club.slug,
    name: club.name,
    shortName: club.shortName,
    badgeImageUrl: club.badgeImageUrl,
    mockJerseyImageUrl: club.mockJerseyImageUrl,
    supportersCount: club.metrics?.supportersCount ?? 0,
    totalPowerRaw: club.metrics?.tfcTotalPowerRaw.toString() ?? "0",
  }));
});

app.get("/clubs", async (request) => {
  const query = z
    .object({
      query: z.string().trim().min(1).optional(),
    })
    .parse(request.query);

  if (!query.query) {
    return [];
  }

  const normalizedQuery = query.query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  const clubs = await prisma.club.findMany({
    where: {
      isActive: true,
      OR: [
        { normalizedName: { contains: normalizedQuery } },
        {
          aliases: {
            some: {
              normalizedAlias: { contains: normalizedQuery },
            },
          },
        },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    include: {
      metrics: true,
    },
    take: 12,
  });

  return clubs.map((club) => ({
    id: club.id.toString(),
    slug: club.slug,
    name: club.name,
    shortName: club.shortName,
    badgeImageUrl: club.badgeImageUrl,
    mockJerseyImageUrl: club.mockJerseyImageUrl,
    supportersCount: club.metrics?.supportersCount ?? 0,
    totalPowerRaw: club.metrics?.tfcTotalPowerRaw.toString() ?? "0",
  }));
});

app.get("/rankings", async () => {
  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    include: { metrics: true },
  });

  const biggest = [...clubs]
    .sort((left, right) => (right.metrics?.supportersCount ?? 0) - (left.metrics?.supportersCount ?? 0))
    .map((club) => ({
      club: club.name,
      slug: club.slug,
      value: club.metrics?.supportersCount ?? 0,
    }));

  const strongest = [...clubs]
    .sort((left, right) => {
      const leftValue = BigInt(left.metrics?.tfcTotalPowerRaw.toString() ?? "0");
      const rightValue = BigInt(right.metrics?.tfcTotalPowerRaw.toString() ?? "0");

      if (leftValue === rightValue) {
        return 0;
      }

      return leftValue > rightValue ? -1 : 1;
    })
    .map((club) => ({
      club: club.name,
      slug: club.slug,
      valueRaw: club.metrics?.tfcTotalPowerRaw.toString() ?? "0",
    }));

  return { biggest, strongest };
});

app.get("/clubs/:slug/dashboard", async (request, reply) => {
  const params = z.object({ slug: z.string().trim().min(1) }).parse(request.params);

  const club = await prisma.club.findUnique({
    where: { slug: params.slug },
    include: {
      metrics: true,
      contests: {
        orderBy: { startsAt: "desc" },
        take: 1,
        include: {
          designs: {
            orderBy: { onchainDesignId: "asc" },
          },
        },
      },
      shopProducts: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!club) {
    return reply.code(404).send({ error: "Club not found" });
  }

  const contest = club.contests[0] ?? null;

  return {
    club: {
      id: club.id.toString(),
      slug: club.slug,
      name: club.name,
      shortName: club.shortName,
      badgeImageUrl: club.badgeImageUrl,
      mockJerseyImageUrl: club.mockJerseyImageUrl,
    },
    metrics: {
      supportersCount: club.metrics?.supportersCount ?? 0,
      totalPowerRaw: club.metrics?.tfcTotalPowerRaw.toString() ?? "0",
      topupVolumeRaw: club.metrics?.tfcTopupVolumeRaw.toString() ?? "0",
      supportVolumeRaw: club.metrics?.tfcSupportVolumeRaw.toString() ?? "0",
      shopVolumeRaw: club.metrics?.tfcShopVolumeRaw.toString() ?? "0",
    },
    contest: contest
      ? {
          id: contest.id,
          onchainContestId: contest.onchainContestId.toString(),
          title: contest.title,
          status: contest.status,
          startsAt: contest.startsAt,
          endsAt: contest.endsAt,
          treasuryAddress: contest.treasuryAddress,
          designs: contest.designs.map((design) => ({
            id: design.id,
            onchainDesignId: design.onchainDesignId.toString(),
            title: design.title,
            creatorLabel: design.creatorLabel,
            previewImageUrl: design.previewImageUrl,
            metadataUri: design.metadataUri,
          })),
        }
      : null,
    shopProducts: club.shopProducts.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.imageUrl,
      priceTfcRaw: product.priceTfcRaw.toString(),
    })),
  };
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

function resolveFirstEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

async function authenticatePrivySession(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!privyClient) {
    await reply.code(503).send({
      error: "Privy nao esta configurado neste ambiente.",
    });

    return null;
  }

  const accessToken = extractBearerToken(request.headers.authorization);

  if (!accessToken) {
    await reply.code(401).send({
      error: "Sessao ausente.",
    });

    return null;
  }

  try {
    return await privyClient.utils().auth().verifyAccessToken(accessToken);
  } catch (error) {
    request.log.warn({ error }, "Falha ao validar access token do Privy");
    await reply.code(401).send({
      error: "Sessao invalida.",
    });
    return null;
  }
}

function normalizeWalletInputs(wallets: Array<z.infer<typeof authSessionBodySchema>["wallets"][number]>) {
  const byAddress = new Map<
    string,
    {
      address: string;
      isEmbedded: boolean;
      provider: string;
    }
  >();

  for (const wallet of wallets) {
    const address = wallet.address.toLowerCase();

    byAddress.set(address, {
      address,
      isEmbedded: wallet.isEmbedded ?? true,
      provider: wallet.provider ?? "privy",
    });
  }

  return [...byAddress.values()];
}

async function buildAppUserState(userId: string) {
  const [membership, wallets, balanceTfcRaw] = await Promise.all([
    prisma.clubMembership.findUnique({
      where: { userId },
      include: { club: true },
    }),
    prisma.userWallet.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    getUserBalanceRaw(userId),
  ]);

  return {
    membership: membership
      ? {
          clubId: membership.clubId.toString(),
          clubName: membership.club.name,
          clubPassTokenId: membership.clubPassTokenId?.toString() ?? null,
          clubSlug: membership.club.slug,
          joinedAt: membership.joinedAt,
        }
      : null,
    wallets: wallets.map((wallet) => ({
      address: wallet.walletAddress,
      isEmbedded: wallet.isEmbedded,
      provider: wallet.provider,
    })),
    balanceTfcRaw: balanceTfcRaw.toString(),
  };
}

async function getUserBalanceRaw(userId: string) {
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: {
      userId,
      status: "posted",
    },
    select: {
      amountRaw: true,
      direction: true,
    },
  });

  return ledgerEntries.reduce((total, entry) => {
    const amount = BigInt(entry.amountRaw.toString());
    return entry.direction === "credit" ? total + amount : total - amount;
  }, 0n);
}
