-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "search_string" TEXT,
    "columns" TEXT,
    "data" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_id_key" ON "Sheet"("id");
