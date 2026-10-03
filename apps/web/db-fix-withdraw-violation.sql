-- Chay trong MySQL cua ban (mysql client hoac DBeaver/phpMyAdmin)
-- DB: vay365, port 3307

ALTER TABLE `CustomerProfile`
  ADD COLUMN IF NOT EXISTS `withdrawViolation` TINYINT(1) NOT NULL DEFAULT 0;

-- Kiem tra
SHOW COLUMNS FROM `CustomerProfile` LIKE 'withdrawViolation';
