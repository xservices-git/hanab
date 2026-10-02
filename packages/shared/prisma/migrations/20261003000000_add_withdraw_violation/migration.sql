-- Add withdrawViolation flag to CustomerProfile
-- Used by admin to mark clients who violated withdrawal policy.
-- When set, the client-side "Ví tiền" page shows "Rút tiền vi phạm" instead of "Sai thông tin liên kết ví".

ALTER TABLE CustomerProfile
  ADD COLUMN withdrawViolation TINYINT(1) NOT NULL DEFAULT 0;