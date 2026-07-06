-- Migrate billing plans from starter/team/business to standard/pro.
--
-- Backfill mapping:
--   starter  -> standard
--   team     -> standard
--   business -> pro

-- 1. Backfill existing rows before changing the constraint.
UPDATE organisation_billing_profiles
SET plan_key = 'standard',
    plan_name = 'Standard',
    seat_quantity = 6,
    seat_allowance = 6,
    active_tender_limit = 15,
    updated_at = now()
WHERE plan_key IN ('starter', 'team');

UPDATE organisation_billing_profiles
SET plan_key = 'pro',
    plan_name = 'Pro',
    seat_quantity = 10,
    seat_allowance = 10,
    active_tender_limit = 30,
    updated_at = now()
WHERE plan_key = 'business';

-- 2. Drop old CHECK constraint and add new one.
ALTER TABLE organisation_billing_profiles
  DROP CONSTRAINT IF EXISTS organisation_billing_profiles_plan_key_check;

ALTER TABLE organisation_billing_profiles
  ADD CONSTRAINT organisation_billing_profiles_plan_key_check
  CHECK (plan_key IN ('standard', 'pro'));

-- 3. Update column defaults to match the Standard tier.
ALTER TABLE organisation_billing_profiles
  ALTER COLUMN plan_key SET DEFAULT 'standard',
  ALTER COLUMN plan_name SET DEFAULT 'Standard',
  ALTER COLUMN active_tender_limit SET DEFAULT 15,
  ALTER COLUMN seat_quantity SET DEFAULT 6,
  ALTER COLUMN seat_allowance SET DEFAULT 6;
