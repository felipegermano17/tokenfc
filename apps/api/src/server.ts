import cors from "@fastify/cors";
import { prisma } from "@tokenfc/db";
import Fastify from "fastify";
import { z } from "zod";

const host = process.env.API_HOST ?? "0.0.0.0";
const port = z.coerce.number().default(4000).parse(process.env.API_PORT ?? "4000");

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
