/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `UserNotification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_user_id_key" ON "UserNotification"("user_id");
