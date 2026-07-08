/*
  Warnings:

  - You are about to drop the column `ho_so_dieu_tri_id` on the `nhat_ky_buoi_dieu_tri` table. All the data in the column will be lost.
  - You are about to drop the column `ho_so_dieu_tri_id` on the `phac_do_dieu_tri` table. All the data in the column will be lost.
  - You are about to drop the `ho_so_dieu_tri` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `khach_hang_id` to the `phac_do_dieu_tri` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ho_so_dieu_tri" DROP CONSTRAINT "ho_so_dieu_tri_khach_hang_id_fkey";

-- DropForeignKey
ALTER TABLE "nhat_ky_buoi_dieu_tri" DROP CONSTRAINT "nhat_ky_buoi_dieu_tri_ho_so_dieu_tri_id_fkey";

-- DropForeignKey
ALTER TABLE "phac_do_dieu_tri" DROP CONSTRAINT "phac_do_dieu_tri_ho_so_dieu_tri_id_fkey";

-- AlterTable
ALTER TABLE "nhat_ky_buoi_dieu_tri" DROP COLUMN "ho_so_dieu_tri_id";

-- AlterTable
ALTER TABLE "phac_do_dieu_tri" DROP COLUMN "ho_so_dieu_tri_id",
ADD COLUMN     "khach_hang_id" UUID NOT NULL;

-- DropTable
DROP TABLE "ho_so_dieu_tri";

-- AddForeignKey
ALTER TABLE "phac_do_dieu_tri" ADD CONSTRAINT "phac_do_dieu_tri_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
