-- Create the permit_fallback table for storing permits when pipelines are unavailable
CREATE TABLE IF NOT EXISTS permit_fallback (
  id TEXT PRIMARY KEY,
  application_number TEXT NOT NULL,
  permit_type TEXT NOT NULL,
  status TEXT NOT NULL,
  filed_date TEXT NOT NULL,
  issued_date TEXT,
  completed_date TEXT,
  description TEXT NOT NULL,
  estimated_cost REAL,
  revised_cost REAL,
  existing_use TEXT,
  proposed_use TEXT,
  plansets INTEGER,
  address TEXT NOT NULL,
  block TEXT NOT NULL,
  lot TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  applicant_name TEXT,
  applicant_address TEXT,
  inspector_name TEXT,
  inspection_date TEXT,
  inspection_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_permit_fallback_application_number ON permit_fallback(application_number);
CREATE INDEX IF NOT EXISTS idx_permit_fallback_permit_type ON permit_fallback(permit_type);
CREATE INDEX IF NOT EXISTS idx_permit_fallback_status ON permit_fallback(status);
CREATE INDEX IF NOT EXISTS idx_permit_fallback_filed_date ON permit_fallback(filed_date);
CREATE INDEX IF NOT EXISTS idx_permit_fallback_zipcode ON permit_fallback(zipcode);
CREATE INDEX IF NOT EXISTS idx_permit_fallback_created_at ON permit_fallback(created_at);