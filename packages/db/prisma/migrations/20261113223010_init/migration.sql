-- CreateEnum
CREATE TYPE "StatBlockType" AS ENUM ('RECEIVED', 'REQUIRED');

-- CreateEnum
CREATE TYPE "AliasKind" AS ENUM ('ID', 'NAME', 'IMAGE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MOB', 'CHEST', 'GACHA', 'BUSH', 'TOGBU', 'CACTUS', 'FISH', 'FARM');

-- CreateTable
CREATE TABLE "DropEpoch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "DropEpoch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggSource" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "epochId" INTEGER NOT NULL,
    "totalEncounters" INTEGER NOT NULL,
    "encountersWithDrops" INTEGER NOT NULL,
    "uniqueUsers" INTEGER NOT NULL,
    "encountersWithCoins" INTEGER,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggDropDetails" (
    "aggSourceId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "encountersWithItem" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL,

    CONSTRAINT "AggDropDetails_pkey" PRIMARY KEY ("aggSourceId","itemId")
);

-- CreateTable
CREATE TABLE "AggCoinDetails" (
    "aggSourceId" INTEGER NOT NULL,
    "coinId" INTEGER NOT NULL,
    "encountersWithCoins" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL,

    CONSTRAINT "AggCoinDetails_pkey" PRIMARY KEY ("aggSourceId","coinId")
);

-- CreateTable
CREATE TABLE "ItemType" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishingArea" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FishingArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatType" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CombatType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAlias" (
    "kind" "AliasKind" NOT NULL,
    "value" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ItemAlias_pkey" PRIMARY KEY ("kind","value")
);

-- CreateTable
CREATE TABLE "MobAlias" (
    "kind" "AliasKind" NOT NULL,
    "value" TEXT NOT NULL,
    "mobId" INTEGER NOT NULL,

    CONSTRAINT "MobAlias_pkey" PRIMARY KEY ("kind","value")
);

-- CreateTable
CREATE TABLE "AmbiguousAlias" (
    "kind" "AliasKind" NOT NULL,
    "value" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "AmbiguousAlias_pkey" PRIMARY KEY ("kind","value")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "wikiPage" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "itemName" TEXT,
    "itemImg" TEXT,
    "description" TEXT,
    "price" INTEGER,
    "edible" BOOLEAN,
    "seasonId" INTEGER,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatBlock" (
    "id" SERIAL NOT NULL,
    "statBlockType" "StatBlockType" NOT NULL,
    "bravery" INTEGER,
    "coordination" INTEGER,
    "creativity" INTEGER,
    "hardiness" INTEGER,
    "nutrition" INTEGER,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "StatBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatDetail" (
    "id" SERIAL NOT NULL,
    "combatTypeId" INTEGER,
    "damage" INTEGER,
    "hpHeal" INTEGER,
    "cooldownTurns" INTEGER,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "CombatDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mob" (
    "id" SERIAL NOT NULL,
    "wikiName" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "mobName" TEXT,
    "mobImg" TEXT,
    "description" TEXT,
    "isBoss" BOOLEAN,
    "hp" INTEGER,
    "braveryGet" INTEGER,
    "combatTypeId" INTEGER,

    CONSTRAINT "Mob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chest" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "wikiName" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "chestName" TEXT,
    "chestImg" TEXT,
    "description" TEXT,

    CONSTRAINT "Chest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "variant" TEXT,
    "mobId" INTEGER,
    "chestId" INTEGER,
    "floorId" INTEGER,
    "fishConditionId" INTEGER,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "extensionVersion" TEXT NOT NULL,
    "doBuildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDrop" (
    "snapshotId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ItemDrop_pkey" PRIMARY KEY ("snapshotId","itemId")
);

-- CreateTable
CREATE TABLE "CoinDrop" (
    "snapshotId" TEXT NOT NULL,
    "coinId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CoinDrop_pkey" PRIMARY KEY ("snapshotId","coinId")
);

-- CreateTable
CREATE TABLE "FishCondition" (
    "id" SERIAL NOT NULL,
    "weatherId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,
    "baitId" INTEGER NOT NULL,
    "toolId" INTEGER NOT NULL,

    CONSTRAINT "FishCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weather" (
    "id" SERIAL NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "weather" TEXT NOT NULL,

    CONSTRAINT "Weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyLast4" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ItemToItemType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ItemToItemType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AggSource_sourceId_epochId_key" ON "AggSource"("sourceId", "epochId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemType_externalId_key" ON "ItemType"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_externalId_key" ON "Season"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_externalId_key" ON "Floor"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "FishingArea_externalId_key" ON "FishingArea"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Coin_value_key" ON "Coin"("value");

-- CreateIndex
CREATE UNIQUE INDEX "CombatType_externalId_key" ON "CombatType"("externalId");

-- CreateIndex
CREATE INDEX "ItemAlias_itemId_idx" ON "ItemAlias"("itemId");

-- CreateIndex
CREATE INDEX "MobAlias_mobId_idx" ON "MobAlias"("mobId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_wikiPage_key" ON "Item"("wikiPage");

-- CreateIndex
CREATE UNIQUE INDEX "StatBlock_itemId_statBlockType_key" ON "StatBlock"("itemId", "statBlockType");

-- CreateIndex
CREATE UNIQUE INDEX "CombatDetail_itemId_key" ON "CombatDetail"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Mob_wikiName_key" ON "Mob"("wikiName");

-- CreateIndex
CREATE UNIQUE INDEX "Chest_externalId_key" ON "Chest"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Chest_wikiName_key" ON "Chest"("wikiName");

-- CreateIndex
CREATE UNIQUE INDEX "Source_key_key" ON "Source"("key");

-- CreateIndex
CREATE INDEX "Source_mobId_floorId_idx" ON "Source"("mobId", "floorId");

-- CreateIndex
CREATE INDEX "Source_fishConditionId_idx" ON "Source"("fishConditionId");

-- CreateIndex
CREATE INDEX "Source_chestId_floorId_idx" ON "Source"("chestId", "floorId");

-- CreateIndex
CREATE INDEX "Snapshot_userId_idx" ON "Snapshot"("userId");

-- CreateIndex
CREATE INDEX "Snapshot_sourceId_idx" ON "Snapshot"("sourceId");

-- CreateIndex
CREATE INDEX "Snapshot_receivedAt_idx" ON "Snapshot"("receivedAt");

-- CreateIndex
CREATE INDEX "ItemDrop_itemId_idx" ON "ItemDrop"("itemId");

-- CreateIndex
CREATE INDEX "CoinDrop_coinId_idx" ON "CoinDrop"("coinId");

-- CreateIndex
CREATE UNIQUE INDEX "FishCondition_weatherId_areaId_baitId_toolId_key" ON "FishCondition"("weatherId", "areaId", "baitId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "Weather_timeOfDay_weather_key" ON "Weather"("timeOfDay", "weather");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKeyHash_key" ON "User"("apiKeyHash");

-- CreateIndex
CREATE INDEX "_ItemToItemType_B_index" ON "_ItemToItemType"("B");

-- AddForeignKey
ALTER TABLE "AggSource" ADD CONSTRAINT "AggSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggSource" ADD CONSTRAINT "AggSource_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "DropEpoch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggDropDetails" ADD CONSTRAINT "AggDropDetails_aggSourceId_fkey" FOREIGN KEY ("aggSourceId") REFERENCES "AggSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggDropDetails" ADD CONSTRAINT "AggDropDetails_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggCoinDetails" ADD CONSTRAINT "AggCoinDetails_aggSourceId_fkey" FOREIGN KEY ("aggSourceId") REFERENCES "AggSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggCoinDetails" ADD CONSTRAINT "AggCoinDetails_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAlias" ADD CONSTRAINT "ItemAlias_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobAlias" ADD CONSTRAINT "MobAlias_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "Mob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatBlock" ADD CONSTRAINT "StatBlock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatDetail" ADD CONSTRAINT "CombatDetail_combatTypeId_fkey" FOREIGN KEY ("combatTypeId") REFERENCES "CombatType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatDetail" ADD CONSTRAINT "CombatDetail_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mob" ADD CONSTRAINT "Mob_combatTypeId_fkey" FOREIGN KEY ("combatTypeId") REFERENCES "CombatType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "Mob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_chestId_fkey" FOREIGN KEY ("chestId") REFERENCES "Chest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_fishConditionId_fkey" FOREIGN KEY ("fishConditionId") REFERENCES "FishCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDrop" ADD CONSTRAINT "ItemDrop_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDrop" ADD CONSTRAINT "ItemDrop_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinDrop" ADD CONSTRAINT "CoinDrop_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinDrop" ADD CONSTRAINT "CoinDrop_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishCondition" ADD CONSTRAINT "FishCondition_weatherId_fkey" FOREIGN KEY ("weatherId") REFERENCES "Weather"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishCondition" ADD CONSTRAINT "FishCondition_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "FishingArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishCondition" ADD CONSTRAINT "FishCondition_baitId_fkey" FOREIGN KEY ("baitId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishCondition" ADD CONSTRAINT "FishCondition_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToItemType" ADD CONSTRAINT "_ItemToItemType_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToItemType" ADD CONSTRAINT "_ItemToItemType_B_fkey" FOREIGN KEY ("B") REFERENCES "ItemType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
