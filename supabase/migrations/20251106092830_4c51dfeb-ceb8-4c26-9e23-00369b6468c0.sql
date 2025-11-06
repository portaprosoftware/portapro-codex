-- Seed Smith Rentals organization
INSERT INTO public.organizations (
  clerk_org_id,
  organization_id,
  name,
  subdomain,
  org_name,
  org_slug,
  is_active,
  metadata
) VALUES (
  'org_2sdHhJXV47Ud1g9ZSZ5eR0W2QKG',
  'org_2sdHhJXV47Ud1g9ZSZ5eR0W2QKG',
  'Smith Rentals',
  'smith-rentals',
  'Smith Rentals',
  'smith-rentals',
  true,
  '{}'::jsonb
) ON CONFLICT (clerk_org_id) 
DO UPDATE SET 
  name = COALESCE(EXCLUDED.name, organizations.name),
  subdomain = COALESCE(EXCLUDED.subdomain, organizations.subdomain),
  org_name = COALESCE(EXCLUDED.org_name, organizations.org_name),
  org_slug = COALESCE(EXCLUDED.org_slug, organizations.org_slug),
  is_active = COALESCE(EXCLUDED.is_active, organizations.is_active),
  updated_at = now();