-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "collab_user_id" TEXT;

-- AlterTable
ALTER TABLE "Motorcycle" ADD COLUMN     "license_plate" TEXT,
ADD COLUMN     "owned_from" TIMESTAMP(3),
ADD COLUMN     "owned_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "status" "FollowStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotoGarupa" (
    "id" TEXT NOT NULL,
    "piloto_id" TEXT NOT NULL,
    "garupa_id" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotoGarupa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Follow_follower_id_following_id_key" ON "Follow"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "PilotoGarupa_piloto_id_garupa_id_key" ON "PilotoGarupa"("piloto_id", "garupa_id");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotoGarupa" ADD CONSTRAINT "PilotoGarupa_piloto_id_fkey" FOREIGN KEY ("piloto_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotoGarupa" ADD CONSTRAINT "PilotoGarupa_garupa_id_fkey" FOREIGN KEY ("garupa_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_collab_user_id_fkey" FOREIGN KEY ("collab_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
