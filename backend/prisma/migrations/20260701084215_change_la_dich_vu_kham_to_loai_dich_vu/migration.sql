/*
  Warnings:

  - You are about to drop the column `la_dich_vu_kham` on the `dich_vu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dich_vu" DROP COLUMN "la_dich_vu_kham",
ADD COLUMN     "loai_dich_vu" VARCHAR(20) NOT NULL DEFAULT 'DIEU_TRI';
