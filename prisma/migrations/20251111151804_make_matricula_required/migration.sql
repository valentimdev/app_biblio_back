/*
  Warnings:

  - Made the column `matricula` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
UPDATE "users" SET "matricula" = '1337420' WHERE "matricula" IS NULL;
-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "matricula" SET NOT NULL;
