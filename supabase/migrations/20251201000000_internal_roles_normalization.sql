-- Normalize legacy roles to new internal set
-- Maps legacy org:* and legacy names to admin/dispatcher/driver/customer

-- Update user_roles records
UPDATE public.user_roles
SET role = CASE
  WHEN role IN ('org:owner', 'org:admin', 'owner', 'admin') THEN 'admin'
  WHEN role IN ('org:dispatcher', 'dispatch', 'dispatcher') THEN 'dispatcher'
  WHEN role IN ('org:driver', 'driver') THEN 'driver'
  WHEN role IN ('viewer', 'org:viewer', 'customer') THEN 'customer'
  ELSE role
END
WHERE role IS NOT NULL;

-- Default any missing roles to customer
UPDATE public.user_roles
SET role = 'customer'
WHERE role IS NULL;

-- Ensure only the new internal roles are permitted going forward
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_role_internal_check;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_internal_check
CHECK (role IN ('admin', 'dispatcher', 'driver', 'customer'));

-- Keep invitations aligned with the new role set
UPDATE public.user_invitations
SET role = CASE
  WHEN role IN ('org:owner', 'org:admin', 'owner', 'admin') THEN 'admin'
  WHEN role IN ('org:dispatcher', 'dispatch', 'dispatcher') THEN 'dispatcher'
  WHEN role IN ('org:driver', 'driver') THEN 'driver'
  WHEN role IS NULL OR role IN ('viewer', 'org:viewer', 'customer') THEN 'customer'
  ELSE role
END;
