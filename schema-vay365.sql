-- Full schema for vay365 database
-- Run on VPS:
--   mysql -u root vay365 < schema-vay365.sql
-- Or import via Navicat

CREATE DATABASE IF NOT EXISTS vay365
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vay365;

-- =====================
-- Enums (MySQL 8+ uses ENUM type, MySQL 5.7 falls back to VARCHAR)
-- =====================
-- Note: Prisma generates enums as VARCHAR with check in MySQL
-- We use VARCHAR for broader compatibility

-- =====================
-- Tables
-- =====================

CREATE TABLE IF NOT EXISTS User (
  id                   VARCHAR(191) NOT NULL,
  email                VARCHAR(191) NULL,
  telegramLink         VARCHAR(191) NULL,
  phone                VARCHAR(191) NULL,
  passwordHash         VARCHAR(191) NOT NULL,
  name                 VARCHAR(191) NULL,
  role                 VARCHAR(191) NOT NULL DEFAULT 'user',
  failedLoginAttempts  INT NOT NULL DEFAULT 0,
  lockedUntil          DATETIME(3) NULL,
  lastLoginAt          DATETIME(3) NULL,
  createdAt            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY User_email_key (email),
  UNIQUE KEY User_phone_key (phone),
  KEY User_email_idx (email),
  KEY User_phone_idx (phone),
  KEY User_role_idx (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CustomerProfile (
  id                VARCHAR(191) NOT NULL,
  userId            VARCHAR(191) NOT NULL,
  fullName          VARCHAR(191) NULL,
  citizenId         VARCHAR(191) NULL,
  dateOfBirth       DATETIME(3) NULL,
  gender            VARCHAR(191) NULL,
  address           TEXT NULL,
  jobTitle          VARCHAR(191) NULL,
  employerName      VARCHAR(191) NULL,
  monthlyIncome     DOUBLE NULL,
  emergencyName     VARCHAR(191) NULL,
  emergencyPhone    VARCHAR(191) NULL,
  emergencyRelation VARCHAR(191) NULL,
  createdAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY CustomerProfile_userId_key (userId),
  UNIQUE KEY CustomerProfile_citizenId_key (citizenId),
  KEY CustomerProfile_citizenId_idx (citizenId),
  KEY CustomerProfile_createdAt_idx (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS KycProfile (
  id                VARCHAR(191) NOT NULL,
  customerProfileId VARCHAR(191) NOT NULL,
  status            VARCHAR(191) NOT NULL DEFAULT 'pending',
  frontIdUrl        VARCHAR(191) NULL,
  backIdUrl         VARCHAR(191) NULL,
  selfieUrl         VARCHAR(191) NULL,
  rejectionReason   TEXT NULL,
  reviewedBy        VARCHAR(191) NULL,
  reviewedAt        DATETIME(3) NULL,
  createdAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY KycProfile_customerProfileId_idx (customerProfileId),
  KEY KycProfile_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BankAccount (
  id                VARCHAR(191) NOT NULL,
  customerProfileId VARCHAR(191) NOT NULL,
  bankName          VARCHAR(191) NOT NULL,
  accountNumber     VARCHAR(191) NOT NULL,
  accountName       VARCHAR(191) NOT NULL,
  isPrimary         TINYINT(1) NOT NULL DEFAULT 0,
  createdAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY BankAccount_customerProfileId_idx (customerProfileId),
  KEY BankAccount_bankName_idx (bankName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Loan (
  id              VARCHAR(191) NOT NULL,
  userId          VARCHAR(191) NOT NULL,
  assignedAgentId VARCHAR(191) NULL,
  amount          DOUBLE NOT NULL,
  termMonths      INT NOT NULL,
  interestRate    DOUBLE NOT NULL,
  status          VARCHAR(191) NOT NULL DEFAULT 'draft',
  approvedBy      VARCHAR(191) NULL,
  approvedAt      DATETIME(3) NULL,
  rejectedBy      VARCHAR(191) NULL,
  rejectedAt      DATETIME(3) NULL,
  rejectionReason TEXT NULL,
  disbursedAt     DATETIME(3) NULL,
  notes           TEXT NULL,
  createdAt       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY Loan_userId_idx (userId),
  KEY Loan_assignedAgentId_idx (assignedAgentId),
  KEY Loan_status_idx (status),
  KEY Loan_createdAt_idx (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Contract (
  id             VARCHAR(191) NOT NULL,
  loanId         VARCHAR(191) NOT NULL,
  status         VARCHAR(191) NOT NULL DEFAULT 'draft',
  fileUrl        VARCHAR(191) NULL,
  signatureImage LONGTEXT NULL,
  signedAt       DATETIME(3) NULL,
  signatureIp    VARCHAR(191) NULL,
  createdAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY Contract_loanId_idx (loanId),
  KEY Contract_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Notification (
  id        VARCHAR(191) NOT NULL,
  userId    VARCHAR(191) NOT NULL,
  type      VARCHAR(191) NOT NULL DEFAULT 'info',
  title     VARCHAR(191) NOT NULL,
  body      TEXT NULL,
  readAt    DATETIME(3) NULL,
  metadata  JSON NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY Notification_userId_idx (userId),
  KEY Notification_readAt_idx (readAt),
  KEY Notification_createdAt_idx (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Session (
  id        VARCHAR(191) NOT NULL,
  userId    VARCHAR(191) NOT NULL,
  token     VARCHAR(191) NOT NULL,
  ip        VARCHAR(191) NULL,
  userAgent VARCHAR(191) NULL,
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY Session_token_key (token),
  KEY Session_userId_idx (userId),
  KEY Session_token_idx (token),
  KEY Session_expiresAt_idx (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ActivityLog (
  id         VARCHAR(191) NOT NULL,
  userId     VARCHAR(191) NOT NULL,
  action     VARCHAR(191) NOT NULL,
  resource   VARCHAR(191) NULL,
  resourceId VARCHAR(191) NULL,
  metadata   JSON NULL,
  ip         VARCHAR(191) NULL,
  createdAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ActivityLog_userId_idx (userId),
  KEY ActivityLog_action_idx (action),
  KEY ActivityLog_resource_idx (resource),
  KEY ActivityLog_resourceId_idx (resourceId),
  KEY ActivityLog_createdAt_idx (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Foreign keys
-- =====================
-- Note: Prisma generates FKs with cascade as per schema
-- Run these AFTER all tables are created
-- Uses IF-NOT-EXISTS pattern via prepared statements (works in Navicat)

SET @db = DATABASE();

-- CustomerProfile -> User
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'CustomerProfile'
             AND CONSTRAINT_NAME = 'CustomerProfile_userId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE CustomerProfile ADD CONSTRAINT CustomerProfile_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- KycProfile -> CustomerProfile
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'KycProfile'
             AND CONSTRAINT_NAME = 'KycProfile_customerProfileId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE KycProfile ADD CONSTRAINT KycProfile_customerProfileId_fkey FOREIGN KEY (customerProfileId) REFERENCES CustomerProfile(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- BankAccount -> CustomerProfile
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'BankAccount'
             AND CONSTRAINT_NAME = 'BankAccount_customerProfileId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE BankAccount ADD CONSTRAINT BankAccount_customerProfileId_fkey FOREIGN KEY (customerProfileId) REFERENCES CustomerProfile(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Loan -> User (userId)
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'Loan'
             AND CONSTRAINT_NAME = 'Loan_userId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE Loan ADD CONSTRAINT Loan_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Loan -> User (assignedAgentId)
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'Loan'
             AND CONSTRAINT_NAME = 'Loan_assignedAgentId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE Loan ADD CONSTRAINT Loan_assignedAgentId_fkey FOREIGN KEY (assignedAgentId) REFERENCES User(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Contract -> Loan
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'Contract'
             AND CONSTRAINT_NAME = 'Contract_loanId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE Contract ADD CONSTRAINT Contract_loanId_fkey FOREIGN KEY (loanId) REFERENCES Loan(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Notification -> User
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'Notification'
             AND CONSTRAINT_NAME = 'Notification_userId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE Notification ADD CONSTRAINT Notification_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Session -> User
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'Session'
             AND CONSTRAINT_NAME = 'Session_userId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE Session ADD CONSTRAINT Session_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ActivityLog -> User
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'ActivityLog'
             AND CONSTRAINT_NAME = 'ActivityLog_userId_fkey');
SET @sql = IF(@fk = 0,
  'ALTER TABLE ActivityLog ADD CONSTRAINT ActivityLog_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;