-- CreateTable
CREATE TABLE "RequestEvaluation" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "RequestEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestEvaluation_requestId_key" ON "RequestEvaluation"("requestId");

-- AddForeignKey
ALTER TABLE "RequestEvaluation" ADD CONSTRAINT "RequestEvaluation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InternshipRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestEvaluation" ADD CONSTRAINT "RequestEvaluation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
