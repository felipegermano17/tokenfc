import { prisma } from "@tokenfc/db";
import Fastify from "fastify";
import { createPublicClient, createWalletClient, decodeEventLog, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import { z } from "zod";
import {
  clubContestAbi,
  clubPassAbi,
  tfcTokenAbi,
  toOnchainTfcUnits,
  tokenFcDeployments,
} from "./contracts.js";

const host = process.env.WORKER_HOST ?? "0.0.0.0";
const port = z.coerce
  .number()
  .default(4100)
  .parse(process.env.PORT ?? process.env.WORKER_PORT ?? "4100");
const rpcUrl =
  resolveFirstEnv(["MONAD_RPC_URL", "TOKENFC_MONAD_RPC_URL", "RPC_URL"]) ??
  monadTestnet.rpcUrls.default.http[0];
const operatorPrivateKey = resolveFirstEnv([
  "MONAD_OPERATOR_PRIVATE_KEY",
  "TOKENFC_OPERATOR_PRIVATE_KEY",
  "OPERATOR_PRIVATE_KEY",
]);

const operatorAccount = operatorPrivateKey
  ? privateKeyToAccount(toHexPrivateKey(operatorPrivateKey))
  : null;
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(rpcUrl),
});
const walletClient = operatorAccount
  ? createWalletClient({
      account: operatorAccount,
      chain: monadTestnet,
      transport: http(rpcUrl),
    })
  : null;

const processIntentParamsSchema = z.object({
  id: z.string().uuid(),
});
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const bytes32Schema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const contestSupportMetadataSchema = z.object({
  amountRaw: z.string().trim().min(1),
  contestId: z.string().uuid(),
  contestOnchainId: z.string().trim().min(1),
  designId: z.string().uuid(),
  designOnchainId: z.string().trim().min(1),
  intentRef: bytes32Schema,
  txHash: txHashSchema,
});
const shopCheckoutMetadataSchema = z.object({
  priceTfcRaw: z.string().trim().min(1),
  productId: z.string().uuid(),
  productName: z.string().trim().min(1),
});

const app = Fastify({
  logger: true,
});

type LoadedIntent = Awaited<ReturnType<typeof loadIntentForProcessing>>;

app.get("/health", async () => ({
  service: "tokenfc-worker",
  ok: true,
  rpcUrl,
  signerReady: Boolean(walletClient),
}));

app.get("/v1/ping", async () => ({
  now: new Date().toISOString(),
  service: "tokenfc-worker",
  status: "ready-for-onchain-processing",
}));

app.post("/jobs/intents/:id/process", async (request, reply) => {
  if (!walletClient || !operatorAccount) {
    return reply.code(503).send({
      error: "Worker sem signer operacional configurado.",
    });
  }

  const params = processIntentParamsSchema.parse(request.params);

  try {
    const result = await processIntent(params.id);
    return {
      ok: true,
      result,
    };
  } catch (error) {
    request.log.error({ error, intentId: params.id }, "Falha ao processar intent");
    return reply.code(500).send({
      error: error instanceof Error ? error.message : "Falha ao processar intent.",
    });
  }
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

async function processIntent(intentId: string) {
  const intent = await loadIntentForProcessing(intentId);

  if (!intent) {
    throw new Error("Intent nao encontrada.");
  }

  if (!intent.user) {
    throw new Error("Intent sem usuario associado.");
  }

  if (intent.intentType === "onboarding_activation") {
    return processOnboardingIntent(intent);
  }

  if (intent.intentType === "topup_mint") {
    return processTopupMintIntent(intent);
  }

  if (intent.intentType === "contest_support") {
    return processContestSupportIntent(intent);
  }

  if (intent.intentType === "shop_checkout") {
    return processShopCheckoutIntent(intent);
  }

  throw new Error(`Intent type nao suportado pelo worker: ${intent.intentType}`);
}

async function loadIntentForProcessing(intentId: string) {
  return prisma.transactionIntent.findUnique({
    where: { id: intentId },
    include: {
      shopOrders: {
        include: {
          product: true,
        },
      },
      topups: true,
      user: {
        include: {
          membership: {
            include: {
              club: true,
            },
          },
          wallets: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });
}

async function processOnboardingIntent(
  intent: NonNullable<LoadedIntent>,
) {
  if (!walletClient || !operatorAccount) {
    throw new Error("Signer operacional indisponivel.");
  }

  const membership = intent.user?.membership;
  const primaryWallet = intent.user?.wallets[0];

  if (!membership || !primaryWallet) {
    throw new Error("Onboarding sem clube ou wallet principal.");
  }

  const existingLedger = await prisma.ledgerEntry.findUnique({
    where: {
      idempotencyKey: `ledger:onboarding-activation:${intent.userId}`,
    },
  });

  if (existingLedger && membership.clubPassTokenId) {
    await prisma.transactionIntent.update({
      where: { id: intent.id },
      data: {
        finalizedAt: intent.finalizedAt ?? new Date(),
        status: "completed",
      },
    });

    return {
      clubPassTokenId: membership.clubPassTokenId.toString(),
      intentId: intent.id,
      state: "already_completed",
    };
  }

  const walletAddress = primaryWallet.walletAddress as `0x${string}`;
  const clubId = BigInt(membership.clubId.toString());
  const existingTokenId = await publicClient.readContract({
    address: tokenFcDeployments.clubPass,
    abi: clubPassAbi,
    functionName: "membershipTokenOf",
    args: [walletAddress],
  });

  let clubPassTxHash: `0x${string}` | null = null;
  let clubPassTokenId = existingTokenId;

  if (existingTokenId === 0n) {
    clubPassTxHash = await walletClient.writeContract({
      address: tokenFcDeployments.clubPass,
      abi: clubPassAbi,
      functionName: "mint",
      args: [walletAddress, clubId],
      gas: 250_000n,
      chain: monadTestnet,
      account: operatorAccount,
    });

    const clubPassReceipt = await publicClient.waitForTransactionReceipt({
      hash: clubPassTxHash,
    });

    clubPassTokenId = await publicClient.readContract({
      address: tokenFcDeployments.clubPass,
      abi: clubPassAbi,
      functionName: "membershipTokenOf",
      args: [walletAddress],
    });

    await prisma.chainTransaction.create({
      data: {
        txHash: clubPassTxHash as `0x${string}`,
        network: "monad-testnet",
        stage: "onboarding_club_pass",
        fromAddress: operatorAccount.address,
        toContract: tokenFcDeployments.clubPass,
        method: "mint",
        status: "verified",
        blockNumber: clubPassReceipt.blockNumber,
        proposedAt: new Date(),
        verifiedAt: new Date(),
        rawReceipt: normalizeForJson(clubPassReceipt),
      },
    });
  }

  const welcomeMintTxHash = await walletClient.writeContract({
    address: tokenFcDeployments.tfcToken,
    abi: tfcTokenAbi,
    functionName: "mint",
    args: [walletAddress, toOnchainTfcUnits(1n)],
    gas: 120_000n,
    chain: monadTestnet,
    account: operatorAccount,
  });

  const welcomeMintReceipt = await publicClient.waitForTransactionReceipt({
    hash: welcomeMintTxHash,
  });

  await prisma.$transaction(async (tx) => {
    const chainTransaction = await tx.chainTransaction.create({
      data: {
        txHash: welcomeMintTxHash,
        network: "monad-testnet",
        stage: "onboarding_welcome_tfc",
        fromAddress: operatorAccount.address,
        toContract: tokenFcDeployments.tfcToken,
        method: "mint",
        status: "verified",
        blockNumber: welcomeMintReceipt.blockNumber,
        proposedAt: new Date(),
        verifiedAt: new Date(),
        rawReceipt: normalizeForJson(welcomeMintReceipt),
      },
    });

    await tx.transactionIntent.update({
      where: { id: intent.id },
      data: {
        chainTransactionId: chainTransaction.id,
        finalizedAt: new Date(),
        metadata: mergeJsonObject(intent.metadata, {
          clubPassTokenId: clubPassTokenId.toString(),
          clubPassTxHash,
          welcomeMintTxHash,
          workerProcessedAt: new Date().toISOString(),
        }),
        status: "completed",
      },
    });

    await tx.clubMembership.update({
      where: { userId: intent.userId! },
      data: {
        clubPassTokenId: clubPassTokenId.toString(),
      },
    });

    await tx.ledgerEntry.upsert({
      where: {
        idempotencyKey: `ledger:onboarding-activation:${intent.userId}`,
      },
      update: {
        chainTransactionId: chainTransaction.id,
        status: "posted",
      },
      create: {
        userId: intent.userId,
        clubId: membership.clubId,
        asset: "TFC",
        direction: "credit",
        amountRaw: "1",
        reason: "welcome_tfc_grant",
        sourceType: "onboarding_activation",
        sourceId: intent.id,
        transactionIntentId: intent.id,
        chainTransactionId: chainTransaction.id,
        idempotencyKey: `ledger:onboarding-activation:${intent.userId}`,
        status: "posted",
        effectiveAt: new Date(),
      },
    });

    const supportersCount = await tx.clubMembership.count({
      where: {
        clubId: membership.clubId,
      },
    });

    await tx.clubMetrics.upsert({
      where: { clubId: membership.clubId },
      update: {
        supportersCount,
      },
      create: {
        clubId: membership.clubId,
        supportersCount,
      },
    });
  });

  return {
    clubPassTokenId: clubPassTokenId.toString(),
    clubPassTxHash,
    intentId: intent.id,
    state: "completed",
    welcomeMintTxHash,
  };
}

async function processTopupMintIntent(
  intent: NonNullable<LoadedIntent>,
) {
  if (!walletClient || !operatorAccount) {
    throw new Error("Signer operacional indisponivel.");
  }

  const topupOrder = intent.topups[0];
  const primaryWallet = intent.user?.wallets[0];
  const membership = intent.user?.membership;

  if (!topupOrder || !primaryWallet) {
    throw new Error("Topup sem ordem ou wallet principal.");
  }

  const amountRaw = BigInt(topupOrder.tfcAmountRaw.toString());
  const mintTxHash = await walletClient.writeContract({
    address: tokenFcDeployments.tfcToken,
    abi: tfcTokenAbi,
    functionName: "mint",
    args: [primaryWallet.walletAddress as `0x${string}`, toOnchainTfcUnits(amountRaw)],
    gas: 120_000n,
    chain: monadTestnet,
    account: operatorAccount,
  });

  const mintReceipt = await publicClient.waitForTransactionReceipt({
    hash: mintTxHash,
  });

  await prisma.$transaction(async (tx) => {
    const chainTransaction = await tx.chainTransaction.create({
      data: {
        txHash: mintTxHash,
        network: "monad-testnet",
        stage: "topup_mint",
        fromAddress: operatorAccount.address,
        toContract: tokenFcDeployments.tfcToken,
        method: "mint",
        status: "verified",
        blockNumber: mintReceipt.blockNumber,
        proposedAt: new Date(),
        verifiedAt: new Date(),
        rawReceipt: normalizeForJson(mintReceipt),
      },
    });

    await tx.transactionIntent.update({
      where: { id: intent.id },
      data: {
        chainTransactionId: chainTransaction.id,
        finalizedAt: new Date(),
        metadata: mergeJsonObject(intent.metadata, {
          topupMintTxHash: mintTxHash,
          workerProcessedAt: new Date().toISOString(),
        }),
        status: "completed",
      },
    });

    await tx.ledgerEntry.upsert({
      where: {
        idempotencyKey: `ledger:topup:${topupOrder.id}`,
      },
      update: {
        chainTransactionId: chainTransaction.id,
        status: "posted",
      },
      create: {
        userId: intent.userId,
        clubId: membership?.clubId ?? null,
        asset: "TFC",
        direction: "credit",
        amountRaw: amountRaw.toString(),
        reason: "topup_pix_mock",
        sourceType: "topup_order",
        sourceId: topupOrder.id,
        transactionIntentId: intent.id,
        chainTransactionId: chainTransaction.id,
        idempotencyKey: `ledger:topup:${topupOrder.id}`,
        status: "posted",
        effectiveAt: new Date(),
      },
    });

    await tx.topupOrder.update({
      where: { id: topupOrder.id },
      data: {
        customerStatus: "completed",
        internalStatus: "completed",
      },
    });

    if (membership) {
      await tx.clubMetrics.upsert({
        where: { clubId: membership.clubId },
        update: {
          tfcTopupVolumeRaw: {
            increment: amountRaw.toString(),
          },
          tfcTotalPowerRaw: {
            increment: amountRaw.toString(),
          },
        },
        create: {
          clubId: membership.clubId,
          supportersCount: await tx.clubMembership.count({
            where: {
              clubId: membership.clubId,
            },
          }),
          tfcTopupVolumeRaw: amountRaw.toString(),
          tfcTotalPowerRaw: amountRaw.toString(),
        },
      });
    }
  });

  return {
    intentId: intent.id,
    mintTxHash,
    state: "completed",
    topupOrderId: topupOrder.id,
  };
}

async function processContestSupportIntent(
  intent: NonNullable<LoadedIntent>,
) {
  const primaryWallet = intent.user?.wallets[0];
  const membership = intent.user?.membership;
  const metadata = contestSupportMetadataSchema.parse(
    normalizeJsonObject(intent.metadata) ?? {},
  );

  if (!primaryWallet || !membership || !intent.userId) {
    throw new Error("Apoio sem clube, wallet principal ou usuario.");
  }

  const userId = intent.userId;

  const existingLedger = await prisma.ledgerEntry.findUnique({
    where: {
      idempotencyKey: `ledger:contest-support:${intent.id}`,
    },
  });
  const existingSupport = await prisma.contestSupport.findFirst({
    where: {
      transactionIntentId: intent.id,
    },
  });

  if (existingLedger && existingSupport) {
    await prisma.transactionIntent.update({
      where: { id: intent.id },
      data: {
        finalizedAt: intent.finalizedAt ?? new Date(),
        status: "completed",
      },
    });

    return {
      contestSupportId: existingSupport.id,
      intentId: intent.id,
      state: "already_completed",
      txHash: metadata.txHash,
    };
  }

  const txHash = metadata.txHash as `0x${string}`;
  const supportReceipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  if (supportReceipt.status !== "success") {
    throw new Error("O apoio nao foi confirmado na rede.");
  }

  if (
    supportReceipt.from.toLowerCase() !==
    primaryWallet.walletAddress.toLowerCase()
  ) {
    throw new Error("A transacao confirmada nao saiu da wallet principal da conta.");
  }

  const supportEvent = findSupportAddedEvent(supportReceipt.logs, metadata.intentRef);

  if (!supportEvent) {
    throw new Error("Nao encontramos o evento de apoio esperado para esta intent.");
  }

  if (
    supportEvent.contestId.toString() !== metadata.contestOnchainId ||
    supportEvent.designId.toString() !== metadata.designOnchainId
  ) {
    throw new Error("O apoio confirmado nao bate com a campanha preparada.");
  }

  const amountRaw = BigInt(metadata.amountRaw);

  if (supportEvent.amount !== toOnchainTfcUnits(amountRaw)) {
    throw new Error("O valor confirmado na rede nao bate com a intent.");
  }

  if (
    supportEvent.supporter.toLowerCase() !==
    primaryWallet.walletAddress.toLowerCase()
  ) {
    throw new Error("O apoio confirmado pertence a outra wallet.");
  }

  await prisma.$transaction(async (tx) => {
    const chainTransaction = await tx.chainTransaction.upsert({
      where: {
        txHash,
      },
      update: {
        blockNumber: supportReceipt.blockNumber,
        fromAddress: supportReceipt.from,
        method: "supportDesign",
        network: "monad-testnet",
        proposedAt: intent.requestedAt,
        rawReceipt: normalizeForJson(supportReceipt),
        stage: "contest_support",
        status: "verified",
        toContract: tokenFcDeployments.clubContest,
        verifiedAt: new Date(),
      },
      create: {
        txHash,
        network: "monad-testnet",
        stage: "contest_support",
        fromAddress: supportReceipt.from,
        toContract: tokenFcDeployments.clubContest,
        method: "supportDesign",
        status: "verified",
        blockNumber: supportReceipt.blockNumber,
        proposedAt: intent.requestedAt,
        verifiedAt: new Date(),
        rawReceipt: normalizeForJson(supportReceipt),
      },
    });

    const priorSupports = await tx.contestSupport.findMany({
      where: {
        contestId: metadata.contestId,
        designId: metadata.designId,
        status: "confirmed",
        userId,
      },
      select: {
        incrementTfcRaw: true,
      },
    });
    const cumulativeRaw =
      priorSupports.reduce(
        (total, entry) => total + BigInt(entry.incrementTfcRaw.toString()),
        0n,
      ) + amountRaw;

    const supportRecord = existingSupport
      ? await tx.contestSupport.update({
          where: { id: existingSupport.id },
          data: {
            chainTransactionId: chainTransaction.id,
            clubId: membership.clubId,
            contestId: metadata.contestId,
            cumulativeTfcRaw: cumulativeRaw.toString(),
            designId: metadata.designId,
            incrementTfcRaw: amountRaw.toString(),
            status: "confirmed",
            userId,
          },
        })
      : await tx.contestSupport.create({
          data: {
            chainTransactionId: chainTransaction.id,
            clubId: membership.clubId,
            contestId: metadata.contestId,
            cumulativeTfcRaw: cumulativeRaw.toString(),
            designId: metadata.designId,
            incrementTfcRaw: amountRaw.toString(),
            status: "confirmed",
            transactionIntentId: intent.id,
            userId,
          },
        });

    await tx.transactionIntent.update({
      where: { id: intent.id },
      data: {
        chainTransactionId: chainTransaction.id,
        finalizedAt: new Date(),
        metadata: mergeJsonObject(intent.metadata, {
          supportTxHash: txHash,
          workerProcessedAt: new Date().toISOString(),
        }),
        status: "completed",
      },
    });

    await tx.ledgerEntry.upsert({
      where: {
        idempotencyKey: `ledger:contest-support:${intent.id}`,
      },
      update: {
        chainTransactionId: chainTransaction.id,
        status: "posted",
      },
      create: {
        userId: intent.userId,
        clubId: membership.clubId,
        asset: "TFC",
        direction: "debit",
        amountRaw: amountRaw.toString(),
        reason: "contest_support",
        sourceType: "contest_support",
        sourceId: supportRecord.id,
        transactionIntentId: intent.id,
        chainTransactionId: chainTransaction.id,
        idempotencyKey: `ledger:contest-support:${intent.id}`,
        status: "posted",
        effectiveAt: new Date(),
      },
    });

    await tx.clubMetrics.upsert({
      where: { clubId: membership.clubId },
      update: {
        tfcSupportVolumeRaw: {
          increment: amountRaw.toString(),
        },
        tfcTotalPowerRaw: {
          increment: amountRaw.toString(),
        },
      },
      create: {
        clubId: membership.clubId,
        supportersCount: await tx.clubMembership.count({
          where: {
            clubId: membership.clubId,
          },
        }),
        tfcSupportVolumeRaw: amountRaw.toString(),
        tfcTotalPowerRaw: amountRaw.toString(),
      },
    });
  });

  return {
    intentId: intent.id,
    state: "completed",
    txHash,
  };
}

async function processShopCheckoutIntent(
  intent: NonNullable<LoadedIntent>,
) {
  if (!walletClient || !operatorAccount) {
    throw new Error("Signer operacional indisponivel.");
  }

  const shopOrder = intent.shopOrders[0];
  const primaryWallet = intent.user?.wallets[0];
  const membership = intent.user?.membership;
  const metadata = shopCheckoutMetadataSchema.parse(
    normalizeJsonObject(intent.metadata) ?? {},
  );

  if (!shopOrder || !primaryWallet || !intent.userId) {
    throw new Error("Checkout sem pedido, wallet principal ou usuario.");
  }

  const existingLedger = await prisma.ledgerEntry.findUnique({
    where: {
      idempotencyKey: `ledger:shop:${shopOrder.id}`,
    },
  });

  if (existingLedger && shopOrder.customerStatus === "completed") {
    await prisma.transactionIntent.update({
      where: { id: intent.id },
      data: {
        finalizedAt: intent.finalizedAt ?? new Date(),
        status: "completed",
      },
    });

    return {
      intentId: intent.id,
      orderId: shopOrder.id,
      state: "already_completed",
    };
  }

  const amountRaw = BigInt(metadata.priceTfcRaw);
  const burnTxHash = await walletClient.writeContract({
    address: tokenFcDeployments.tfcToken,
    abi: tfcTokenAbi,
    functionName: "burn",
    args: [primaryWallet.walletAddress as `0x${string}`, toOnchainTfcUnits(amountRaw)],
    gas: 120_000n,
    chain: monadTestnet,
    account: operatorAccount,
  });

  const burnReceipt = await publicClient.waitForTransactionReceipt({
    hash: burnTxHash,
  });

  if (burnReceipt.status !== "success") {
    throw new Error("A compra nao foi confirmada na rede.");
  }

  await prisma.$transaction(async (tx) => {
    const chainTransaction = await tx.chainTransaction.upsert({
      where: {
        txHash: burnTxHash,
      },
      update: {
        blockNumber: burnReceipt.blockNumber,
        fromAddress: operatorAccount.address,
        method: "burn",
        network: "monad-testnet",
        proposedAt: intent.requestedAt,
        rawReceipt: normalizeForJson(burnReceipt),
        stage: "shop_checkout_burn",
        status: "verified",
        toContract: tokenFcDeployments.tfcToken,
        verifiedAt: new Date(),
      },
      create: {
        txHash: burnTxHash,
        network: "monad-testnet",
        stage: "shop_checkout_burn",
        fromAddress: operatorAccount.address,
        toContract: tokenFcDeployments.tfcToken,
        method: "burn",
        status: "verified",
        blockNumber: burnReceipt.blockNumber,
        proposedAt: intent.requestedAt,
        verifiedAt: new Date(),
        rawReceipt: normalizeForJson(burnReceipt),
      },
    });

    await tx.transactionIntent.update({
      where: { id: intent.id },
      data: {
        chainTransactionId: chainTransaction.id,
        finalizedAt: new Date(),
        metadata: mergeJsonObject(intent.metadata, {
          checkoutBurnTxHash: burnTxHash,
          workerProcessedAt: new Date().toISOString(),
        }),
        status: "completed",
      },
    });

    await tx.ledgerEntry.upsert({
      where: {
        idempotencyKey: `ledger:shop:${shopOrder.id}`,
      },
      update: {
        chainTransactionId: chainTransaction.id,
        status: "posted",
      },
      create: {
        userId: intent.userId,
        clubId: membership?.clubId ?? shopOrder.clubId,
        asset: "TFC",
        direction: "debit",
        amountRaw: amountRaw.toString(),
        reason: "shop_checkout",
        sourceType: "shop_order",
        sourceId: shopOrder.id,
        transactionIntentId: intent.id,
        chainTransactionId: chainTransaction.id,
        idempotencyKey: `ledger:shop:${shopOrder.id}`,
        status: "posted",
        effectiveAt: new Date(),
      },
    });

    await tx.shopOrder.update({
      where: { id: shopOrder.id },
      data: {
        customerStatus: "completed",
        fulfillmentStatus: "confirmed",
        internalStatus: "completed",
      },
    });

    await tx.clubMetrics.upsert({
      where: { clubId: shopOrder.clubId },
      update: {
        tfcShopVolumeRaw: {
          increment: amountRaw.toString(),
        },
        tfcTotalPowerRaw: {
          increment: amountRaw.toString(),
        },
      },
      create: {
        clubId: shopOrder.clubId,
        supportersCount: await tx.clubMembership.count({
          where: {
            clubId: shopOrder.clubId,
          },
        }),
        tfcShopVolumeRaw: amountRaw.toString(),
        tfcTotalPowerRaw: amountRaw.toString(),
      },
    });
  });

  return {
    burnTxHash,
    intentId: intent.id,
    orderId: shopOrder.id,
    state: "completed",
  };
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

function toHexPrivateKey(value: string) {
  return (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;
}

function normalizeForJson(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as never;
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
){
  return {
    ...(normalizeJsonObject(existing) ?? {}),
    ...additions,
  } as never;
}

function findSupportAddedEvent(
  logs: Array<{
    address: string;
    data: string;
    topics: readonly string[];
  }>,
  intentRef: string,
) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== tokenFcDeployments.clubContest.toLowerCase()) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi: clubContestAbi,
        data: log.data as `0x${string}`,
        topics: log.topics as [] | [`0x${string}`, ...`0x${string}`[]],
      });

      if (decoded.eventName !== "SupportAdded") {
        continue;
      }

      if (decoded.args.intentId.toLowerCase() !== intentRef.toLowerCase()) {
        continue;
      }

      return {
        amount: decoded.args.amount,
        contestId: decoded.args.contestId,
        designId: decoded.args.designId,
        intentId: decoded.args.intentId,
        supporter: decoded.args.supporter,
      };
    } catch {
      continue;
    }
  }

  return null;
}
