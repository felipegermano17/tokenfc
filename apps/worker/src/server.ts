import { prisma } from "@tokenfc/db";
import Fastify from "fastify";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { z } from "zod";
import {
  clubPassAbi,
  tfcTokenAbi,
  toOnchainTfcUnits,
  tokenFcDeployments,
} from "./contracts.js";

const host = process.env.WORKER_HOST ?? "0.0.0.0";
const port = z.coerce.number().default(4100).parse(process.env.WORKER_PORT ?? "4100");
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

  throw new Error(`Intent type nao suportado pelo worker: ${intent.intentType}`);
}

async function loadIntentForProcessing(intentId: string) {
  return prisma.transactionIntent.findUnique({
    where: { id: intentId },
    include: {
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
