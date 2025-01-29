-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedToken" TEXT,
ADD COLUMN     "tokenExpirationDate" TIMESTAMP(3);
