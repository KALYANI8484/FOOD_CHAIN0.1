/*
# Add PDF file storage columns to guides

1. Modified Tables
- guides: add file_data (text, base64 PDF content), file_name (text, original filename)
2. Security
- No changes to existing RLS policies
*/

ALTER TABLE guides ADD COLUMN IF NOT EXISTS file_data text;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS file_name text;
