ALTER TABLE "Category"
ADD COLUMN "normalizedName" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Category"
SET "normalizedName" = LOWER(TRIM("name"));

ALTER TABLE "Category"
ALTER COLUMN "normalizedName" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

DROP INDEX IF EXISTS "Category_name_type_key";
CREATE UNIQUE INDEX "Category_normalizedName_type_key" ON "Category"("normalizedName", "type");
CREATE INDEX "Category_type_isActive_sortOrder_idx" ON "Category"("type", "isActive", "sortOrder");
