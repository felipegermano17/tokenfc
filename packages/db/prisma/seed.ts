import { Prisma } from "@prisma/client";
import { prisma } from "../src/index.js";
import { demoContest, demoProducts, featuredClubs } from "../src/demo-data.js";

const TFC_DECIMALS = 10n ** 18n;

function toRawTfc(value: bigint) {
  return new Prisma.Decimal((value * TFC_DECIMALS).toString());
}

async function seedClubs() {
  for (const club of featuredClubs) {
    const created = await prisma.club.upsert({
      where: { slug: club.slug },
      update: {
        name: club.name,
        shortName: club.shortName,
        normalizedName: club.normalizedName,
        badgeImageUrl: club.badgeImageUrl,
        mockJerseyImageUrl: club.mockJerseyImageUrl,
        badgeStoragePath: club.badgeStoragePath,
        mockJerseyStoragePath: club.mockJerseyStoragePath,
        assetSource: club.assetSource,
        licenseNote: club.licenseNote,
        isFeatured: club.isFeatured,
        isActive: true,
      },
      create: {
        name: club.name,
        slug: club.slug,
        shortName: club.shortName,
        normalizedName: club.normalizedName,
        badgeImageUrl: club.badgeImageUrl,
        mockJerseyImageUrl: club.mockJerseyImageUrl,
        badgeStoragePath: club.badgeStoragePath,
        mockJerseyStoragePath: club.mockJerseyStoragePath,
        assetSource: club.assetSource,
        licenseNote: club.licenseNote,
        isFeatured: club.isFeatured,
        isActive: true,
      },
    });

    for (const alias of club.aliases) {
      await prisma.clubSearchAlias.upsert({
        where: {
          clubId_normalizedAlias: {
            clubId: created.id,
            normalizedAlias: alias,
          },
        },
        update: { alias, normalizedAlias: alias },
        create: {
          clubId: created.id,
          alias,
          normalizedAlias: alias,
        },
      });
    }

    await prisma.clubMetrics.upsert({
      where: { clubId: created.id },
      update: {},
      create: {
        clubId: created.id,
      },
    });
  }
}

async function seedContest() {
  const club = await prisma.club.findUniqueOrThrow({
    where: { slug: demoContest.clubSlug },
  });

  const contest = await prisma.contest.upsert({
    where: { onchainContestId: demoContest.onchainContestId },
    update: {
      title: demoContest.title,
      status: demoContest.status,
      startsAt: demoContest.startsAt,
      endsAt: demoContest.endsAt,
      treasuryAddress: demoContest.treasuryAddress,
      clubId: club.id,
    },
    create: {
      clubId: club.id,
      onchainContestId: demoContest.onchainContestId,
      title: demoContest.title,
      startsAt: demoContest.startsAt,
      endsAt: demoContest.endsAt,
      status: demoContest.status,
      treasuryAddress: demoContest.treasuryAddress,
    },
  });

  for (const design of demoContest.designs) {
    await prisma.contestDesign.upsert({
      where: {
        contestId_onchainDesignId: {
          contestId: contest.id,
          onchainDesignId: design.onchainDesignId,
        },
      },
      update: {
        title: design.title,
        creatorLabel: design.creatorLabel,
        previewImageUrl: design.previewImageUrl,
        metadataUri: design.metadataUri,
      },
      create: {
        contestId: contest.id,
        onchainDesignId: design.onchainDesignId,
        title: design.title,
        creatorLabel: design.creatorLabel,
        previewImageUrl: design.previewImageUrl,
        metadataUri: design.metadataUri,
      },
    });
  }
}

async function seedProducts() {
  for (const product of demoProducts) {
    const club = await prisma.club.findUniqueOrThrow({
      where: { slug: product.clubSlug },
    });

    await prisma.shopProduct.upsert({
      where: { sku: product.sku },
      update: {
        clubId: club.id,
        name: product.name,
        priceTfcRaw: toRawTfc(product.priceTfc),
        imageUrl: product.imageUrl,
        isActive: true,
      },
      create: {
        clubId: club.id,
        name: product.name,
        sku: product.sku,
        priceTfcRaw: toRawTfc(product.priceTfc),
        imageUrl: product.imageUrl,
        isActive: true,
      },
    });
  }
}

async function main() {
  await seedClubs();
  await seedContest();
  await seedProducts();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Token F.C. seed concluido.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
