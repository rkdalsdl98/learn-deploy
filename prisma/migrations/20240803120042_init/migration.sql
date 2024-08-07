/*
  Warnings:

  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "createdAt",
DROP COLUMN "nickname",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "profile" (
    "uid" VARCHAR(64) NOT NULL,
    "nickname" VARCHAR(10) NOT NULL,
    "user_email" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_user_email_key" ON "profile"("user_email");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "user"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
