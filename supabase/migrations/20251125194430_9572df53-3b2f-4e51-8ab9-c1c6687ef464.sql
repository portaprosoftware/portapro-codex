-- Insert new Codex organization
INSERT INTO public.organizations (
  name,
  subdomain,
  clerk_org_id,
  organization_id,
  org_slug,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Codex',
  'codex',
  'org_35z2dD8sKZVaDD83V5hPfDX6Yib',
  'org_35z2dD8sKZVaDD83V5hPfDX6Yib',
  'codex',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (clerk_org_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain,
  org_slug = EXCLUDED.org_slug,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();