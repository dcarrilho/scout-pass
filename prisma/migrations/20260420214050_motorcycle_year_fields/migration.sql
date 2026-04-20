/*
  Warnings:

  - The `owned_from` column on the `Motorcycle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `owned_until` column on the `Motorcycle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Motorcycle" DROP COLUMN "owned_from",
ADD COLUMN     "owned_from" INTEGER,
DROP COLUMN "owned_until",
ADD COLUMN     "owned_until" INTEGER;
