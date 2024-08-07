-- DropIndex
DROP INDEX "user_email_key";

-- DropIndex
DROP INDEX "user_uid_idx";

-- CreateIndex
CREATE INDEX "user_email_uid_idx" ON "user" USING BRIN ("email", "uid");
