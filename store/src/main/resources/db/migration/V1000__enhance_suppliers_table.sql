-- Add new columns to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code VARCHAR(255) UNIQUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(50) NOT NULL DEFAULT 'MATERIALS';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS gst_no VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_holder_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_no VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_type VARCHAR(255);

-- Update existing suppliers to have a code if they don't have one
UPDATE suppliers 
SET code = CONCAT('SUP-', TO_CHAR(created_at, 'YYYYMMDD'), '-', LPAD(id::TEXT, 4, '0'))
WHERE code IS NULL;

-- Make code column NOT NULL after populating it
ALTER TABLE suppliers ALTER COLUMN code SET NOT NULL;
