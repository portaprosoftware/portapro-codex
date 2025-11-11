CREATE UNIQUE INDEX IF NOT EXISTS unique_company_settings_per_org
ON company_settings (organization_id);