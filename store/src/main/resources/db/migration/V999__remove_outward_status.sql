-- Migration: Remove status and closeDate from outward_records
-- Description: Removes status and close_date columns as part of outward simplification
-- Author: System
-- Date: 2025-12-26

-- Remove status column (if exists)
ALTER TABLE outward_records DROP COLUMN IF EXISTS status;

-- Remove close_date column (if exists)
ALTER TABLE outward_records DROP COLUMN IF EXISTS close_date;
