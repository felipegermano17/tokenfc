-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('pending', 'posted', 'reversed', 'failed');

-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('intent_created', 'tx_requested', 'tx_proposed', 'tx_verified', 'ledger_posted', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "privy_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'privy',
    "is_embedded" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "badge_image_url" TEXT NOT NULL,
    "mock_jersey_image_url" TEXT NOT NULL,
    "badge_storage_path" TEXT NOT NULL,
    "mock_jersey_storage_path" TEXT NOT NULL,
    "asset_source" TEXT NOT NULL,
    "license_note" TEXT NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_search_aliases" (
    "id" BIGSERIAL NOT NULL,
    "club_id" BIGINT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,

    CONSTRAINT "club_search_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" BIGINT NOT NULL,
    "club_pass_token_id" DECIMAL(78,0),
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_transactions" (
    "id" UUID NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "from_address" TEXT,
    "to_contract" TEXT,
    "method" TEXT,
    "status" TEXT NOT NULL,
    "block_number" BIGINT,
    "proposed_at" TIMESTAMPTZ(6),
    "verified_at" TIMESTAMPTZ(6),
    "raw_receipt" JSONB,

    CONSTRAINT "chain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_intents" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "wallet_address" TEXT,
    "intent_type" TEXT NOT NULL,
    "source_screen" TEXT NOT NULL,
    "source_action" TEXT NOT NULL,
    "target_contract" TEXT,
    "target_method" TEXT,
    "chain_transaction_id" UUID,
    "status" "IntentStatus" NOT NULL DEFAULT 'intent_created',
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_at" TIMESTAMPTZ(6),

    CONSTRAINT "transaction_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topup_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "brl_amount" DECIMAL(12,2) NOT NULL,
    "tfc_amount_raw" DECIMAL(78,0) NOT NULL,
    "pix_code" TEXT,
    "pix_qr_payload" TEXT,
    "customer_status" TEXT NOT NULL,
    "internal_status" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "approved_at" TIMESTAMPTZ(6),
    "approved_by" TEXT,
    "mint_intent_id" UUID,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topup_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" UUID NOT NULL,
    "club_id" BIGINT NOT NULL,
    "onchain_contest_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL,
    "treasury_address" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_designs" (
    "id" UUID NOT NULL,
    "contest_id" UUID NOT NULL,
    "onchain_design_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "creator_label" TEXT NOT NULL,
    "preview_image_url" TEXT NOT NULL,
    "metadata_uri" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_supports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "contest_id" UUID NOT NULL,
    "design_id" UUID NOT NULL,
    "club_id" BIGINT NOT NULL,
    "increment_tfc_raw" DECIMAL(78,0) NOT NULL,
    "cumulative_tfc_raw" DECIMAL(78,0) NOT NULL,
    "transaction_intent_id" UUID,
    "chain_transaction_id" UUID,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_supports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_products" (
    "id" UUID NOT NULL,
    "club_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price_tfc_raw" DECIMAL(78,0) NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" BIGINT NOT NULL,
    "product_id" UUID NOT NULL,
    "price_tfc_raw" DECIMAL(78,0) NOT NULL,
    "customer_status" TEXT NOT NULL,
    "internal_status" TEXT NOT NULL,
    "payment_intent_id" UUID,
    "fulfillment_status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "club_id" BIGINT,
    "asset" TEXT NOT NULL DEFAULT 'TFC',
    "direction" "LedgerDirection" NOT NULL,
    "amount_raw" DECIMAL(78,0) NOT NULL,
    "reason" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID,
    "transaction_intent_id" UUID,
    "chain_transaction_id" UUID,
    "idempotency_key" TEXT NOT NULL,
    "status" "LedgerStatus" NOT NULL,
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_metrics" (
    "club_id" BIGINT NOT NULL,
    "supporters_count" INTEGER NOT NULL DEFAULT 0,
    "tfc_topup_volume_raw" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "tfc_support_volume_raw" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "tfc_shop_volume_raw" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "tfc_total_power_raw" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_metrics_pkey" PRIMARY KEY ("club_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_privy_user_id_key" ON "users"("privy_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_wallet_address_key" ON "user_wallets"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "club_search_aliases_club_id_normalized_alias_key" ON "club_search_aliases"("club_id", "normalized_alias");

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_user_id_key" ON "club_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chain_transactions_tx_hash_key" ON "chain_transactions"("tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_intents_idempotency_key_key" ON "transaction_intents"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "topup_orders_idempotency_key_key" ON "topup_orders"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "contests_onchain_contest_id_key" ON "contests"("onchain_contest_id");

-- CreateIndex
CREATE UNIQUE INDEX "contest_designs_contest_id_onchain_design_id_key" ON "contest_designs"("contest_id", "onchain_design_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_products_sku_key" ON "shop_products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_idempotency_key_key" ON "ledger_entries"("idempotency_key");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_search_aliases" ADD CONSTRAINT "club_search_aliases_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_intents" ADD CONSTRAINT "transaction_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_intents" ADD CONSTRAINT "transaction_intents_chain_transaction_id_fkey" FOREIGN KEY ("chain_transaction_id") REFERENCES "chain_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topup_orders" ADD CONSTRAINT "topup_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topup_orders" ADD CONSTRAINT "topup_orders_mint_intent_id_fkey" FOREIGN KEY ("mint_intent_id") REFERENCES "transaction_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contests" ADD CONSTRAINT "contests_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_designs" ADD CONSTRAINT "contest_designs_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_supports" ADD CONSTRAINT "contest_supports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_supports" ADD CONSTRAINT "contest_supports_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_supports" ADD CONSTRAINT "contest_supports_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "contest_designs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_supports" ADD CONSTRAINT "contest_supports_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_supports" ADD CONSTRAINT "contest_supports_transaction_intent_id_fkey" FOREIGN KEY ("transaction_intent_id") REFERENCES "transaction_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_supports" ADD CONSTRAINT "contest_supports_chain_transaction_id_fkey" FOREIGN KEY ("chain_transaction_id") REFERENCES "chain_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "shop_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_payment_intent_id_fkey" FOREIGN KEY ("payment_intent_id") REFERENCES "transaction_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_intent_id_fkey" FOREIGN KEY ("transaction_intent_id") REFERENCES "transaction_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_chain_transaction_id_fkey" FOREIGN KEY ("chain_transaction_id") REFERENCES "chain_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_metrics" ADD CONSTRAINT "club_metrics_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

