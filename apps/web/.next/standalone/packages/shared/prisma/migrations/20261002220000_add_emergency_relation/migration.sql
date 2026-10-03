-- =========================================================
-- Fix: Add missing emergencyRelation column to CustomerProfile
-- The Prisma schema declares this field but the live DB was missing it.
-- =========================================================

ALTER TABLE `CustomerProfile`
  ADD COLUMN `emergencyRelation` VARCHAR(191) NULL;