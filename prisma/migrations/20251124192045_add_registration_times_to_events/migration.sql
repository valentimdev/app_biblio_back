-- AlterTable
-- Adicionar campos de registro (opcionais)
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "registration_start_time" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "registration_end_time" TIMESTAMP(3);

-- Adicionar campos de evento (obrigatórios, mas inicialmente nullable para popular com dados existentes)
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "event_start_time" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "event_end_time" TIMESTAMP(3);

-- Se a tabela já tem dados, copiar start_time para event_start_time e end_time para event_end_time
UPDATE "public"."events"
SET
  "event_start_time" = COALESCE("event_start_time", "start_time"),
  "event_end_time" = COALESCE("event_end_time", "end_time")
WHERE ("event_start_time" IS NULL AND "start_time" IS NOT NULL)
   OR ("event_end_time" IS NULL AND "end_time" IS NOT NULL);

-- Tornar event_start_time e event_end_time obrigatórios (após popular com dados existentes)
-- Só funciona se todos os registros tiverem valores não-nulos
ALTER TABLE "public"."events"
ALTER COLUMN "event_start_time" SET NOT NULL,
ALTER COLUMN "event_end_time" SET NOT NULL;

