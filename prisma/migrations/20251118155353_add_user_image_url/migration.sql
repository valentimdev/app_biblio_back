-- AlterTable
ALTER TABLE "public"."books" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "isFull" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "image_url" TEXT;
