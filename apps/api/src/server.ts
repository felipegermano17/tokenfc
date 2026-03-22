import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import { GoogleAuth } from "google-auth-library";
import { PrivyClient } from "@privy-io/node";
import { prisma } from "@tokenfc/db";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { encodeFunctionData, keccak256, parseAbi, toBytes, toHex } from "viem";
import { z } from "zod";
import deployments from "../../../packages/contracts/deployments/monad-testnet.json" with { type: "json" };

const host = process.env.API_HOST ?? "0.0.0.0";
const port = z.coerce
  .number()
  .default(4000)
  .parse(process.env.PORT ?? process.env.API_PORT ?? "4000");
const workerUrl =
  resolveFirstEnv(["WORKER_URL", "TOKENFC_WORKER_URL"]) ?? "http://127.0.0.1:4100";
const googleAuth = workerUrl.startsWith("https://") ? new GoogleAuth() : null;
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
const contestSupportPrepareParamsSchema = z.object({
  contestId: z.string().uuid(),
});
const contestSupportPrepareBodySchema = z.object({
  amountTfc: z.coerce.number().int().positive().max(500),
  designId: z.string().uuid(),
});
const contestSupportConfirmParamsSchema = z.object({
  contestId: z.string().uuid(),
  intentId: z.string().uuid(),
});
const contestSupportConfirmBodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
const shopCheckoutBodySchema = z.object({
  productId: z.string().uuid(),
});
type DbTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type BalanceClient = Pick<typeof prisma, "ledgerEntry"> | Pick<DbTransaction, "ledgerEntry">;
type ActivityItemPayload = {
  amount: string;
  detail: string;
  status: string;
  time: string;
  title: string;
};
type LatestSupportState = {
  contestId: string;
  contestTitle: string;
  cumulativeTfcRaw: string;
  designId: string;
  designTitle: string;
  incrementTfcRaw: string;
  status: string;
} | null;
type LatestOrderState = {
  customerStatus: string;
  fulfillmentStatus: string;
  id: string;
  priceTfcRaw: string;
  productId: string;
  productName: string;
} | null;

const MONAD_TESTNET_CHAIN_ID = 10143;
const SUPPORT_GAS_LIMIT = 260_000;
const ONE_TFC_ONCHAIN = 10n ** 18n;
const clubContestSupportAbi = parseAbi([
  "function supportDesign(uint256 contestId, uint256 designId, uint256 amount, bytes32 intentId)",
]);

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

app.get("/me/activity", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const user = await ensureUserForSession(session.user_id);
  const activity = await buildUserActivityData(user.id);

  return {
    ok: true,
    ...activity,
  };
});

app.post("/contests/:contestId/support/prepare", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const params = contestSupportPrepareParamsSchema.parse(request.params);
  const body = contestSupportPrepareBodySchema.parse(request.body ?? {});
  const user = await ensureUserForSession(session.user_id);
  const amountRaw = BigInt(body.amountTfc);
  const balanceTfcRaw = await getUserBalanceRaw(user.id);
  const result = await prisma.$transaction(async (tx) => {
    const [contest, membership, primaryWallet] = await Promise.all([
      tx.contest.findUnique({
        where: { id: params.contestId },
        include: {
          designs: true,
        },
      }),
      tx.clubMembership.findUnique({
        where: { userId: user.id },
      }),
      tx.userWallet.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!membership) {
      return {
        kind: "membership_required" as const,
      };
    }

    if (!contest) {
      return {
        kind: "contest_not_found" as const,
      };
    }

    if (contest.clubId !== membership.clubId) {
      return {
        kind: "club_mismatch" as const,
      };
    }

    if (contest.status !== "active") {
      return {
        kind: "contest_inactive" as const,
      };
    }

    const design = contest.designs.find((candidate) => candidate.id === body.designId);

    if (!design) {
      return {
        kind: "design_not_found" as const,
      };
    }

    if (!primaryWallet) {
      return {
        kind: "wallet_required" as const,
      };
    }

    const lockedSupport = await tx.contestSupport.findFirst({
      where: {
        contestId: contest.id,
        status: "confirmed",
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    if (lockedSupport && lockedSupport.designId !== design.id) {
      return {
        kind: "design_locked" as const,
        designId: lockedSupport.designId,
      };
    }

    if (balanceTfcRaw < amountRaw) {
      return {
        kind: "insufficient_balance" as const,
      };
    }

    const intentId = randomUUID();
    const intentRef = createIntentRef(intentId);
    const intent = await tx.transactionIntent.create({
      data: {
        id: intentId,
        userId: user.id,
        walletAddress: primaryWallet.walletAddress,
        intentType: "contest_support",
        sourceScreen: "campaign",
        sourceAction: "confirm_support",
        targetContract: deployments.clubContest,
        targetMethod: "supportDesign",
        status: "intent_created",
        idempotencyKey: `contest-support:${user.id}:${intentId}`,
        metadata: {
          amountRaw: amountRaw.toString(),
          clubId: membership.clubId.toString(),
          contestId: contest.id,
          contestOnchainId: contest.onchainContestId.toString(),
          designId: design.id,
          designOnchainId: design.onchainDesignId.toString(),
          intentRef,
          sponsorRequired: true,
          workerChainActions: ["reconcile_contest_support"],
        } as never,
      },
    });

    return {
      amountRaw: amountRaw.toString(),
      contest,
      design,
      intent,
      kind: "ok" as const,
    };
  });

  if (result.kind === "membership_required") {
    return reply.code(409).send({
      error: "Defina seu clube antes de apoiar a campanha.",
    });
  }

  if (result.kind === "contest_not_found") {
    return reply.code(404).send({
      error: "Campanha nao encontrada.",
    });
  }

  if (result.kind === "club_mismatch") {
    return reply.code(409).send({
      error: "Esta campanha nao pertence ao clube ativo da sua conta.",
    });
  }

  if (result.kind === "contest_inactive") {
    return reply.code(409).send({
      error: "Esta campanha nao esta recebendo apoio agora.",
    });
  }

  if (result.kind === "design_not_found") {
    return reply.code(404).send({
      error: "Arte nao encontrada nesta campanha.",
    });
  }

  if (result.kind === "wallet_required") {
    return reply.code(409).send({
      error: "Nao encontramos uma wallet pronta para seguir.",
    });
  }

  if (result.kind === "design_locked") {
    return reply.code(409).send({
      error: "Nesta demo, depois do primeiro apoio voce so pode aumentar a mesma arte.",
    });
  }

  if (result.kind === "insufficient_balance") {
    return reply.code(409).send({
      error: "Seu saldo atual nao cobre esse apoio.",
    });
  }

  return {
    ok: true,
    amountTfcRaw: result.amountRaw,
    contest: {
      id: result.contest.id,
      title: result.contest.title,
    },
    design: {
      id: result.design.id,
      title: result.design.title,
    },
    intentId: result.intent.id,
    transaction: {
      chainId: MONAD_TESTNET_CHAIN_ID,
      data: encodeFunctionData({
        abi: clubContestSupportAbi,
        functionName: "supportDesign",
        args: [
          result.contest.onchainContestId,
          result.design.onchainDesignId,
          toOnchainTfcUnits(amountRaw),
          createIntentRef(result.intent.id),
        ],
      }),
      gasLimit: toHex(SUPPORT_GAS_LIMIT),
      to: deployments.clubContest,
      value: "0x0",
    },
  };
});

app.post(
  "/contests/:contestId/support/:intentId/confirm",
  async (request, reply) => {
    const session = await authenticatePrivySession(request, reply);

    if (!session) {
      return;
    }

    const params = contestSupportConfirmParamsSchema.parse(request.params);
    const body = contestSupportConfirmBodySchema.parse(request.body ?? {});
    const user = await ensureUserForSession(session.user_id);
    const result = await prisma.$transaction(async (tx) => {
      const intent = await tx.transactionIntent.findUnique({
        where: { id: params.intentId },
      });

      if (
        !intent ||
        intent.userId !== user.id ||
        intent.intentType !== "contest_support"
      ) {
        return {
          kind: "not_found" as const,
        };
      }

      const metadata = normalizeJsonObject(intent.metadata);

      if (metadata?.contestId !== params.contestId) {
        return {
          kind: "not_found" as const,
        };
      }

      await tx.transactionIntent.update({
        where: { id: intent.id },
        data: {
          metadata: mergeJsonObject(intent.metadata, {
            txHash: body.txHash,
            txProposedAt: new Date().toISOString(),
          }),
          status: intent.status === "completed" ? "completed" : "tx_proposed",
        },
      });

      return {
        intentId: intent.id,
        kind: "ok" as const,
        status: intent.status,
      };
    });

    if (result.kind === "not_found") {
      return reply.code(404).send({
        error: "Intent de apoio nao encontrada.",
      });
    }

    const workerResult =
      result.status === "completed"
        ? { state: "completed" }
        : await enqueueWorkerIntent(result.intentId, request.log);

    return {
      ok: true,
      processingState: workerResult?.state ?? "queued",
      ...(await buildAppUserState(user.id)),
    };
  },
);

app.post("/shop/checkout", async (request, reply) => {
  const session = await authenticatePrivySession(request, reply);

  if (!session) {
    return;
  }

  const body = shopCheckoutBodySchema.parse(request.body ?? {});
  const user = await ensureUserForSession(session.user_id);
  const result = await prisma.$transaction(async (tx) => {
    const [membership, primaryWallet, product] = await Promise.all([
      tx.clubMembership.findUnique({
        where: { userId: user.id },
      }),
      tx.userWallet.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),
      tx.shopProduct.findUnique({
        where: { id: body.productId },
      }),
    ]);

    if (!membership) {
      return {
        kind: "membership_required" as const,
      };
    }

    if (!primaryWallet) {
      return {
        kind: "wallet_required" as const,
      };
    }

    if (!product || !product.isActive) {
      return {
        kind: "product_not_found" as const,
      };
    }

    if (product.clubId !== membership.clubId) {
      return {
        kind: "club_mismatch" as const,
      };
    }

    const balanceTfcRaw = await getUserBalanceRawWithClient(tx, user.id);
    const priceTfcRaw = BigInt(product.priceTfcRaw.toString());

    if (balanceTfcRaw < priceTfcRaw) {
      return {
        kind: "insufficient_balance" as const,
      };
    }

    const intentId = randomUUID();
    const orderId = randomUUID();
    await tx.transactionIntent.create({
      data: {
        id: intentId,
        userId: user.id,
        walletAddress: primaryWallet.walletAddress,
        intentType: "shop_checkout",
        sourceScreen: "checkout",
        sourceAction: "confirm_purchase",
        targetContract: deployments.tfcToken,
        targetMethod: "burn",
        status: "intent_created",
        idempotencyKey: `shop-checkout:${user.id}:${orderId}`,
        metadata: {
          clubId: product.clubId.toString(),
          priceTfcRaw: priceTfcRaw.toString(),
          productId: product.id,
          productName: product.name,
          workerChainActions: ["burn_checkout_tfc"],
        } as never,
      },
    });

    const order = await tx.shopOrder.create({
      data: {
        id: orderId,
        userId: user.id,
        clubId: product.clubId,
        productId: product.id,
        priceTfcRaw: priceTfcRaw.toString(),
        customerStatus: "processing",
        internalStatus: "burn_requested",
        paymentIntentId: intentId,
        fulfillmentStatus: "awaiting_confirmation",
      },
      include: {
        product: true,
      },
    });

    return {
      kind: "ok" as const,
      order,
      intentId,
    };
  });

  if (result.kind === "membership_required") {
    return reply.code(409).send({
      error: "Defina seu clube antes de concluir uma compra.",
    });
  }

  if (result.kind === "wallet_required") {
    return reply.code(409).send({
      error: "Nao encontramos uma wallet pronta para seguir.",
    });
  }

  if (result.kind === "product_not_found") {
    return reply.code(404).send({
      error: "Produto nao encontrado.",
    });
  }

  if (result.kind === "club_mismatch") {
    return reply.code(409).send({
      error: "Este produto nao pertence ao clube ativo da sua conta.",
    });
  }

  if (result.kind === "insufficient_balance") {
    return reply.code(409).send({
      error: "Seu saldo atual nao cobre esta compra.",
    });
  }

  const workerResult = await enqueueWorkerIntent(result.intentId, request.log);

  return {
    ok: true,
    order: {
      customerStatus: result.order.customerStatus,
      fulfillmentStatus: result.order.fulfillmentStatus,
      id: result.order.id,
      priceTfcRaw: result.order.priceTfcRaw.toString(),
      productId: result.order.productId,
      productName: result.order.product.name,
    },
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
  const contestSupports = contest
    ? await prisma.contestSupport.findMany({
        where: {
          contestId: contest.id,
          status: "confirmed",
        },
        select: {
          designId: true,
          incrementTfcRaw: true,
          userId: true,
        },
      })
    : [];
  const contestDesignMetrics = new Map<
    string,
    {
      supporters: Set<string>;
      totalTfcRaw: bigint;
    }
  >();

  for (const support of contestSupports) {
    const current =
      contestDesignMetrics.get(support.designId) ??
      {
        supporters: new Set<string>(),
        totalTfcRaw: 0n,
      };
    current.supporters.add(support.userId);
    current.totalTfcRaw += BigInt(support.incrementTfcRaw.toString());
    contestDesignMetrics.set(support.designId, current);
  }

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
          designs: contest.designs
            .map((design) => {
              const metrics = contestDesignMetrics.get(design.id);

              return {
                id: design.id,
                onchainDesignId: design.onchainDesignId.toString(),
                title: design.title,
                creatorLabel: design.creatorLabel,
                previewImageUrl: design.previewImageUrl,
                metadataUri: design.metadataUri,
                supportersCount: metrics?.supporters.size ?? 0,
                totalTfcRaw: metrics?.totalTfcRaw.toString() ?? "0",
              };
            })
            .sort((left, right) => {
              const leftTotal = BigInt(left.totalTfcRaw);
              const rightTotal = BigInt(right.totalTfcRaw);

              if (leftTotal === rightTotal) {
                return Number(BigInt(left.onchainDesignId) - BigInt(right.onchainDesignId));
              }

              return leftTotal > rightTotal ? -1 : 1;
            }),
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
  const [
    membership,
    wallets,
    balanceTfcRaw,
    latestOnboardingIntent,
    latestTopupOrder,
    activityData,
  ] =
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
      buildUserActivityData(userId),
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
    activity: activityData.activity,
    activitySummary: activityData.activitySummary,
    latestOrder: activityData.latestOrder,
    latestSupport: activityData.latestSupport,
    wallets: wallets.map((wallet) => ({
      address: wallet.walletAddress,
      isEmbedded: wallet.isEmbedded,
      provider: wallet.provider,
    })),
  };
}

async function getUserBalanceRaw(userId: string) {
  return getUserBalanceRawWithClient(prisma, userId);
}

async function getUserBalanceRawWithClient(
  client: BalanceClient,
  userId: string,
) {
  const ledgerEntries = await client.ledgerEntry.findMany({
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

async function buildUserActivityData(userId: string) {
  const [ledgerEntries, latestOrder, latestSupport, latestTopup, currentBalanceTfcRaw] =
    await Promise.all([
      prisma.ledgerEntry.findMany({
        where: {
          userId,
          status: "posted",
        },
        orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
        take: 12,
      }),
      prisma.shopOrder.findFirst({
        where: {
          customerStatus: "completed",
          userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          product: true,
        },
      }),
      prisma.contestSupport.findFirst({
        where: {
          status: "confirmed",
          userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          contest: true,
          design: true,
        },
      }),
      prisma.topupOrder.findFirst({
        where: {
          customerStatus: "completed",
          userId,
        },
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      }),
      getUserBalanceRaw(userId),
    ]);

  const supportIds = ledgerEntries
    .filter((entry) => entry.sourceType === "contest_support" && entry.sourceId)
    .map((entry) => entry.sourceId!)
    .filter((value, index, values) => values.indexOf(value) === index);
  const shopIds = ledgerEntries
    .filter((entry) => entry.sourceType === "shop_order" && entry.sourceId)
    .map((entry) => entry.sourceId!)
    .filter((value, index, values) => values.indexOf(value) === index);
  const topupIds = ledgerEntries
    .filter((entry) => entry.sourceType === "topup_order" && entry.sourceId)
    .map((entry) => entry.sourceId!)
    .filter((value, index, values) => values.indexOf(value) === index);
  const onboardingIntentIds = ledgerEntries
    .filter(
      (entry) =>
        entry.sourceType === "onboarding_activation" &&
        (entry.sourceId ?? entry.transactionIntentId),
    )
    .map((entry) => entry.sourceId ?? entry.transactionIntentId!)
    .filter((value, index, values) => values.indexOf(value) === index);
  const [supports, orders, topups, onboardingIntents] = await Promise.all([
    supportIds.length
      ? prisma.contestSupport.findMany({
          where: {
            id: { in: supportIds },
          },
          include: {
            design: true,
          },
        })
      : Promise.resolve([]),
    shopIds.length
      ? prisma.shopOrder.findMany({
          where: {
            id: { in: shopIds },
          },
          include: {
            product: true,
          },
        })
      : Promise.resolve([]),
    topupIds.length
      ? prisma.topupOrder.findMany({
          where: {
            id: { in: topupIds },
          },
        })
      : Promise.resolve([]),
    onboardingIntentIds.length
      ? prisma.transactionIntent.findMany({
          where: {
            id: { in: onboardingIntentIds },
          },
        })
      : Promise.resolve([]),
  ]);
  const supportById = new Map(supports.map((support) => [support.id, support]));
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const topupById = new Map(topups.map((topup) => [topup.id, topup]));
  const onboardingById = new Map(
    onboardingIntents.map((intent) => [intent.id, intent]),
  );

  return {
    activity: ledgerEntries.map((entry) =>
      buildActivityItemPayload(entry, {
        onboardingById,
        orderById,
        supportById,
        topupById,
      }),
    ),
    activitySummary: {
      currentBalanceTfcRaw: currentBalanceTfcRaw.toString(),
      lastOrderTfcRaw: latestOrder?.priceTfcRaw.toString() ?? "0",
      lastSupportTfcRaw: latestSupport?.incrementTfcRaw.toString() ?? "0",
      lastTopupTfcRaw: latestTopup?.tfcAmountRaw.toString() ?? "0",
    },
    latestOrder: latestOrder
      ? {
          customerStatus: latestOrder.customerStatus,
          fulfillmentStatus: latestOrder.fulfillmentStatus,
          id: latestOrder.id,
          priceTfcRaw: latestOrder.priceTfcRaw.toString(),
          productId: latestOrder.productId,
          productName: latestOrder.product.name,
        }
      : null,
    latestSupport: latestSupport
      ? {
          contestId: latestSupport.contestId,
          contestTitle: latestSupport.contest.title,
          cumulativeTfcRaw: latestSupport.cumulativeTfcRaw.toString(),
          designId: latestSupport.designId,
          designTitle: latestSupport.design.title,
          incrementTfcRaw: latestSupport.incrementTfcRaw.toString(),
          status: latestSupport.status,
        }
      : null,
  };
}

function buildActivityItemPayload(
  entry: {
    amountRaw: { toString(): string };
    createdAt: Date;
    direction: "credit" | "debit";
    effectiveAt: Date;
    reason: string;
    sourceId: string | null;
    sourceType: string;
    transactionIntentId: string | null;
  },
  references: {
    onboardingById: Map<string, { id: string }>;
    orderById: Map<string, { product: { name: string } }>;
    supportById: Map<string, { design: { title: string } }>;
    topupById: Map<string, { tfcAmountRaw: { toString(): string } }>;
  },
): ActivityItemPayload {
  const amountRaw = entry.amountRaw.toString();
  const timestamp = formatActivityTime(entry.effectiveAt ?? entry.createdAt);

  if (entry.sourceType === "shop_order" && entry.sourceId) {
    const order = references.orderById.get(entry.sourceId);

    return {
      amount: formatSignedTfc("debit", amountRaw),
      detail: order?.product.name ?? "Pedido confirmado",
      status: "Concluido",
      time: timestamp,
      title: "Compra concluida",
    };
  }

  if (entry.sourceType === "contest_support" && entry.sourceId) {
    const support = references.supportById.get(entry.sourceId);

    return {
      amount: formatSignedTfc("debit", amountRaw),
      detail: support?.design.title ?? "Apoio em campanha",
      status: "Confirmado",
      time: timestamp,
      title: "Apoio confirmado",
    };
  }

  if (entry.sourceType === "topup_order" && entry.sourceId) {
    const topup = references.topupById.get(entry.sourceId);

    return {
      amount: formatSignedTfc(
        "credit",
        topup?.tfcAmountRaw.toString() ?? amountRaw,
      ),
      detail: "PIX confirmado",
      status: "Saldo liberado",
      time: timestamp,
      title: "Credito liberado",
    };
  }

  if (
    entry.sourceType === "onboarding_activation" &&
    (entry.sourceId ?? entry.transactionIntentId) &&
    references.onboardingById.has(entry.sourceId ?? entry.transactionIntentId!)
  ) {
    return {
      amount: formatSignedTfc("credit", amountRaw),
      detail: "ClubPass + saldo inicial",
      status: "Ativo",
      time: timestamp,
      title: "Perfil ativado",
    };
  }

  return {
    amount: formatSignedTfc(entry.direction, amountRaw),
    detail: "Movimento confirmado na conta",
    status: entry.reason === "topup_pix_mock" ? "Saldo liberado" : "Confirmado",
    time: timestamp,
    title: entry.direction === "credit" ? "Credito confirmado" : "Saida confirmada",
  };
}

async function enqueueWorkerIntent(
  intentId: string,
  logger?: {
    warn: (...args: unknown[]) => void;
  },
) {
  try {
    const authHeaders = await getWorkerRequestHeaders();
    const response = await fetch(`${workerUrl}/jobs/intents/${intentId}/process`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders,
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

async function getWorkerRequestHeaders() {
  if (!googleAuth) {
    return {};
  }

  const client = await googleAuth.getIdTokenClient(workerUrl);
  const headers = await client.getRequestHeaders(workerUrl);
  return Object.fromEntries(headers.entries());
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

function createIntentRef(intentId: string) {
  return keccak256(toBytes(intentId));
}

function toOnchainTfcUnits(amountRaw: bigint) {
  return amountRaw * ONE_TFC_ONCHAIN;
}

function normalizeJsonObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function mergeJsonObject(
  existing: unknown,
  additions: Record<string, unknown>,
) {
  return {
    ...(normalizeJsonObject(existing) ?? {}),
    ...additions,
  } as never;
}

function formatSignedTfc(
  direction: "credit" | "debit",
  amountRaw: string,
) {
  const sign = direction === "credit" ? "+" : "-";
  return `${sign}${new Intl.NumberFormat("pt-BR").format(BigInt(amountRaw))} TFC`;
}

function formatActivityTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}
