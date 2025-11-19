-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM (
    'GENERIC',
    'EVENT_REGISTRATION',
    'EVENT_STATUS',
    'EVENT_REMINDER',
    'BOOK_RENTAL'
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'GENERIC',
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "public"."notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "public"."notifications"
ADD CONSTRAINT "notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

