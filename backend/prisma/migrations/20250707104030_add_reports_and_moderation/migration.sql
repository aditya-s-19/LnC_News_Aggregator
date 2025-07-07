-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserReportedArticle" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "article_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReportedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiddenArticleKeyword" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenArticleKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReportedArticle_user_id_article_id_key" ON "UserReportedArticle"("user_id", "article_id");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenArticleKeyword_keyword_key" ON "HiddenArticleKeyword"("keyword");

-- AddForeignKey
ALTER TABLE "UserReportedArticle" ADD CONSTRAINT "UserReportedArticle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReportedArticle" ADD CONSTRAINT "UserReportedArticle_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
