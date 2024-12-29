import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop existing role column if it exists
    ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "role_select";

    -- Drop enum if it exists
    DROP TYPE IF EXISTS "public"."enum_users_role";

    -- Create enum type
    CREATE TYPE "public"."enum_users_role" AS ENUM('administrator', 'editor', 'author', 'subscriber');

    -- Add new role column with enum type
    ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'subscriber' NOT NULL;

    -- Set first user as administrator if exists
    WITH first_user AS (
      SELECT id FROM "users" ORDER BY created_at ASC LIMIT 1
    )
    UPDATE "users"
    SET "role" = 'administrator'
    WHERE id IN (SELECT id FROM first_user);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop role column
    ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

    -- Drop enum type
    DROP TYPE IF EXISTS "public"."enum_users_role";

    -- Add back varchar role column
    ALTER TABLE "users" ADD COLUMN "role" varchar DEFAULT 'subscriber' NOT NULL;
  `)
}
