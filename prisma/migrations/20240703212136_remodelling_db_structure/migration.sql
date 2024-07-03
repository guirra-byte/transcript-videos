-- CreateTable
CREATE TABLE "transcription" (
    "id" TEXT NOT NULL,
    "readableURL" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "s3_identifier" TEXT NOT NULL,
    "s3_destine_bucket" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoId" TEXT,

    CONSTRAINT "transcription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "s3_identifier" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "s3_identifier" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transcription_id_key" ON "transcription"("id");

-- CreateIndex
CREATE UNIQUE INDEX "transcription_readableURL_key" ON "transcription"("readableURL");

-- CreateIndex
CREATE UNIQUE INDEX "Video_id_key" ON "Video"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Chunk_id_key" ON "Chunk"("id");

-- AddForeignKey
ALTER TABLE "transcription" ADD CONSTRAINT "transcription_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
