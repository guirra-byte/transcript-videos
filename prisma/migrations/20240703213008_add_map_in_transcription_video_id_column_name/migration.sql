/*
  Warnings:

  - You are about to drop the column `videoId` on the `transcription` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "transcription" DROP CONSTRAINT "transcription_videoId_fkey";

-- AlterTable
ALTER TABLE "transcription" DROP COLUMN "videoId",
ADD COLUMN     "video_id" TEXT;

-- AddForeignKey
ALTER TABLE "transcription" ADD CONSTRAINT "transcription_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
