-- CreateTable
CREATE TABLE "user" (
    "uid" VARCHAR(64) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "pass" VARCHAR(100) NOT NULL,
    "salt" VARCHAR(34) NOT NULL,
    "nickname" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE INDEX "user_uid_idx" ON "user" USING BRIN ("uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
