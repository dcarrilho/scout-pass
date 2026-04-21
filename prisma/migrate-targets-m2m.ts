/**
 * Migra ChallengeTarget de 1:N para M:N.
 * Cria a join table _ChallengeTargets e popula com os dados existentes de challenge_id.
 *
 * Rodar ANTES de aplicar o novo schema:
 *   npx tsx prisma/migrate-targets-m2m.ts
 */

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log("Criando join table _ChallengeTargets...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_ChallengeTargets" (
        "A" text NOT NULL,
        "B" text NOT NULL,
        CONSTRAINT "_ChallengeTargets_AB_pkey" PRIMARY KEY ("A", "B")
      );
      CREATE INDEX IF NOT EXISTS "_ChallengeTargets_B_index"
        ON "_ChallengeTargets" ("B");
    `);

    console.log("Populando join table a partir de challenge_id existente...");
    const result = await client.query(`
      INSERT INTO "_ChallengeTargets" ("A", "B")
      SELECT challenge_id, id
      FROM "ChallengeTarget"
      WHERE challenge_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    console.log(`✅ ${result.rowCount} registros inseridos na join table.`);
    console.log('\nAgora atualize schema.prisma e rode: npx prisma db push');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
