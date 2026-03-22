import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import { PrivyClient } from "@privy-io/node";
import { prisma } from "@tokenfc/db";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import deployments from "../../../packages/contracts/deployments/monad-testnet.json" with { type: "json" };

const host = process.env.API_HOST ?? "0.0.0.0";
const port = z.coerce.number().default(4000).parse(process.env.API_PORT ?? "4000");
const workerUrl =
  resolveFirstEnv(["WORKER_URL", "TOKENFC_WORKER_URL"]) ?? "http://127.0.0.1:4100";
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
const topupCreateBodySchema = z.object({
  amountTfc: z.coerce.number().int().positive().max(500),
});
const topupApproveParamsSchema = z.object({
  id: z.string().uuid(),
});
type DbTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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
  const user = await ensureUserForSession(session.user_id);

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

  const user = await ensureUserForSession(session.user_id);

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

  const user = await ensureUserForSession(session.user_id);
  const result = await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.clubMembership.findUnique({
      where: { userId: user.id },
    });

    if (existingMembership && existingMembership.clubId !== club.id) {
      return {
        kind: "locked" as const,
      };
    }

    if (!existingMembership) {
      await tx.clubMembership.create({
        data: {
          userId: user.id,
          clubId: club.id,
        },
      });
      await syncClubMetricsSupporterCount(tx, club.id);
    }

    const primaryWallet = await tx.userWallet.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    const onboardingIntentKey = `onboarding-activation:${user.id}`;
    const existingIntent = await tx.transactionIntent.findUnique({
      where: { idempotencyKey: onboardingIntentKey },
    });
    const intent =
      existingIntent ??
      (await tx.transactionIntent.create({
        data: {
          userId: user.id,
          walletAddress: primaryWallet?.walletAddress ?? null,
          intentType: "onboarding_activation",
          sourceScreen: "onboarding",
          sourceAction: "select_club",
          targetContract: deployments.clubPass,
          targetMethod: "mint+mint",
          status: "intent_created",
          idempotencyKey: onboardingIntentKey,
          metadata: {
            clubId: club.id.toString(),
            clubSlug: club.slug,
            sponsorRequired: false,
            workerChainActions: ["mint_club_pass", "mint_welcome_tfc"],
          } as never,
        },
      }));

    return {
      clubSlug: club.slug,
      intentId: intent.id,
      kind: "ok" as const,
    };
  });

  if (result.kind === "locked") {
    return reply.code(409).send({
      error: "Seu clube ja foi definido e nao pode ser trocado nesta demo.",
    });
  }

  const workerResult = await enqueueWorkerIntent(result.intentId, request.log);
  const state = await buildAppUserState(user.id);

  return {
    ok: true,
    selection: {
      clubSlug: result.clubSlug,
      clubPassStatus: state.membership?.clubPassTokenId ? "active" : "pending",
      intentId: result.intentId,
      processingState: workerResult?.state ?? "queued",
      welcomeGranted: BigInt(state.balanceTfcRaw) >= 1n,
    },
    ...state,
  };
});

app.post("/topup/pix", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const body = topupCreateBodySchema.parse(request.body ?? {});
  const user = await ensureUserForSession(session.user_id);
  const membership = await prisma.clubMembership.findUnique({
    where: { userId: user.id },
  });

  if (!membership) {
    return reply.code(409).send({
      error: "Defina seu clube antes de adicionar saldo.",
    });
  }

  const amountTfc = BigInt(body.amountTfc);
  const topupOrder = await prisma.topupOrder.create({
    data: {
      userId: user.id,
      brlAmount: body.amountTfc.toFixed(2),
      tfcAmountRaw: amountTfc.toString(),
      pixCode: generatePixCode(body.amountTfc),
      pixQrPayload: generatePixCode(body.amountTfc),
      customerStatus: "awaiting_payment",
      internalStatus: "awaiting_payment",
      idempotencyKey: `topup:${user.id}:${randomUUID()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const currentBalance = await getUserBalanceRaw(user.id);

  return {
    ok: true,
    order: {
      brlAmount: topupOrder.brlAmount.toString(),
      customerStatus: topupOrder.customerStatus,
      expiresAt: topupOrder.expiresAt,
      id: topupOrder.id,
      pixCode: topupOrder.pixCode,
      pixQrPayload: topupOrder.pixQrPayload,
      tfcAmountRaw: topupOrder.tfcAmountRaw.toString(),
    },
    projectedBalanceTfcRaw: (currentBalance + amountTfc).toString(),
  };
});

app.post("/topup/pix/:id/approve", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const params = topupApproveParamsSchema.parse(request.params);
  const user = await ensureUserForSession(session.user_id);
  const result = await prisma.$transaction(async (tx) => {
    const topupOrder = await tx.topupOrder.findUnique({
      where: { id: params.id },
      include: {
        user: {
          include: {
            membership: true,
            wallets: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!topupOrder || topupOrder.userId !== user.id) {
      return {
        kind: "not_found" as const,
      };
    }

    let mintIntentId = topupOrder.mintIntentId;

    if (!mintIntentId) {
      const mintIntent = await tx.transactionIntent.create({
        data: {
          userId: user.id,
          walletAddress: topupOrder.user.wallets[0]?.walletAddress ?? null,
          intentType: "topup_mint",
          sourceScreen: "topup",
          sourceAction: "approve_pix_mock",
          targetContract: deployments.tfcToken,
          targetMethod: "mint",
          status: "intent_created",
          idempotencyKey: `topup-mint:${topupOrder.id}`,
          metadata: {
            clubId: topupOrder.user.membership?.clubId.toString() ?? null,
            sourceOrderId: topupOrder.id,
            tfcAmountRaw: topupOrder.tfcAmountRaw.toString(),
            workerChainActions: ["mint_topup_tfc"],
          } as never,
        },
      });
      mintIntentId = mintIntent.id;
    }

    const updatedOrder = await tx.topupOrder.update({
      where: { id: topupOrder.id },
      data: {
        approvedAt: topupOrder.approvedAt ?? new Date(),
        approvedBy: topupOrder.approvedBy ?? "mock_pix_approval",
        customerStatus:
          topupOrder.customerStatus === "completed"
            ? "completed"
            : "payment_approved_mock",
        internalStatus:
          topupOrder.internalStatus === "completed"
            ? "completed"
            : "mint_requested",
        mintIntentId,
      },
    });

    return {
      kind: "ok" as const,
      mintIntentId,
      orderId: updatedOrder.id,
    };
  });

  if (result.kind === "not_found") {
    return reply.code(404).send({
      error: "Ordem de topup nao encontrada.",
    });
  }

  const workerResult = await enqueueWorkerIntent(result.mintIntentId, request.log);
  const refreshedOrder = await prisma.topupOrder.findUnique({
    where: { id: result.orderId },
  });

  return {
    ok: true,
    order: refreshedOrder
      ? {
          customerStatus: refreshedOrder.customerStatus,
          id: refreshedOrder.id,
          internalStatus: refreshedOrder.internalStatus,
          tfcAmountRaw: refreshedOrder.tfcAmountRaw.toString(),
        }
      : null,
    processingState: workerResult?.state ?? "queued",
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
    .sort(
      (left, right) =>
        (right.metrics?.supportersCount ?? 0) - (left.metrics?.supportersCount ?? 0),
    )
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

function normalizeWalletInputs(
  wallets: Array<z.infer<typeof authSessionBodySchema>["wallets"][number]>,
) {
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

async function ensureUserForSession(privyUserId: string) {
  return prisma.user.upsert({
    where: { privyUserId },
    update: {},
    create: { privyUserId },
  });
}

async function buildAppUserState(userId: string) {
  const [membership, wallets, balanceTfcRaw, latestOnboardingIntent, latestTopupOrder] =
    await Promise.all([
      prisma.clubMembership.findUnique({
        where: { userId },
        include: { club: true },
      }),
      prisma.userWallet.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      getUserBalanceRaw(userId),
      prisma.transactionIntent.findFirst({
        where: {
          userId,
          intentType: "onboarding_activation",
        },
        orderBy: { requestedAt: "desc" },
      }),
      prisma.topupOrder.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    activation: latestOnboardingIntent
      ? {
          intentId: latestOnboardingIntent.id,
          status: latestOnboardingIntent.status,
        }
      : null,
    balanceTfcRaw: balanceTfcRaw.toString(),
    latestTopup: latestTopupOrder
      ? {
          customerStatus: latestTopupOrder.customerStatus,
          id: latestTopupOrder.id,
          internalStatus: latestTopupOrder.internalStatus,
          tfcAmountRaw: latestTopupOrder.tfcAmountRaw.toString(),
        }
      : null,
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

async function enqueueWorkerIntent(
  intentId: string,
  logger?: {
    warn: (...args: unknown[]) => void;
  },
) {
  try {
    const response = await fetch(`${workerUrl}/jobs/intents/${intentId}/process`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      logger?.warn(
        { intentId, payload, workerUrl },
        "Worker respondeu com erro ao processar intent",
      );
      return null;
    }

    const payload = (await response.json()) as {
      result?: {
        state?: string;
      };
    };
    return payload.result ?? null;
  } catch (error) {
    logger?.warn(
      { error, intentId, workerUrl },
      "Nao foi possivel acionar o worker para esta intent",
    );
    return null;
  }
}

function generatePixCode(amountTfc: number) {
  const amountBlock = String(amountTfc).padStart(3, "0");
  return `00020126580014BR.GOV.BCB.PIX0136TOKENFC-PIX${amountBlock}5204000053039865802BR5925TOKEN FC PIX6009SAO PAULO62070503***6304ABCD`;
}

async function syncClubMetricsSupporterCount(
  tx: DbTransaction,
  clubId: bigint,
) {
  const supportersCount = await tx.clubMembership.count({
    where: { clubId },
  });

  await tx.clubMetrics.upsert({
    where: { clubId },
    update: {
      supportersCount,
    },
    create: {
      clubId,
      supportersCount,
    },
  });
}
