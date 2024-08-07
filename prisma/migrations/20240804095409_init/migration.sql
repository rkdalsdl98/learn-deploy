-- DropForeignKey
ALTER TABLE "profile" DROP CONSTRAINT "profile_user_email_fkey";

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE CASCADE;
