-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'BANNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "public"."users"
    ADD COLUMN "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE';

