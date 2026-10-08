-- Check for duplicate non-empty Sheet IDs before creating the unique index.
SELECT external_id, COUNT(*) AS duplicate_count
FROM public.properties
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING COUNT(*) > 1;

-- The upsert from Apps Script requires external_id to be unique.
-- Run this only after the query above returns no rows.
CREATE UNIQUE INDEX IF NOT EXISTS properties_external_id_key
ON public.properties (external_id);

-- Allow the Apps Script service_role key to upsert property rows.
GRANT SELECT, INSERT, UPDATE ON public.properties TO service_role;

-- Allow public listing lookups while the existing RLS policy limits rows
-- to properties whose status is available.
GRANT SELECT ON public.properties TO anon, authenticated;

-- Allow the booking Edge Function service_role to check conflicts,
-- expire timed-out holds, create bookings, and return the created row.
GRANT SELECT, INSERT, UPDATE ON public.bookings TO service_role;
