-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."books" ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loan_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
