-- Migration script to add validated column to outward_registers table
-- Run this SQL script on your MySQL database

ALTER TABLE outward_registers 
ADD COLUMN validated BOOLEAN NOT NULL DEFAULT FALSE 
AFTER close_date;

-- Update existing records to set validated = false if needed
UPDATE outward_registers SET validated = FALSE WHERE validated IS NULL;
