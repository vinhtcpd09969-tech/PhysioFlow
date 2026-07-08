/*
  Warnings:

  - You are about to drop the column `loai` on the `chi_dinh_buoi` table. All the data in the column will be lost.
  - You are about to drop the column `loai` on the `nhat_ky_buoi_dieu_tri` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chi_dinh_buoi" DROP COLUMN "loai";

-- AlterTable
ALTER TABLE "nhat_ky_buoi_dieu_tri" DROP COLUMN "loai";
