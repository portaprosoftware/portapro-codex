-- RLS and organization_id repair pass
-- Applies org-scoped policies to all multi-tenant tables and fixes storage protections

-- Standardize policies for all tables with organization_id
DO $$
DECLARE
  rec record;
  policy_row record;
  has_created_by boolean;
  update_guard text;
BEGIN
  FOR rec IN (
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE column_name = 'organization_id'
      AND table_schema IN ('public', 'storage')
    GROUP BY table_schema, table_name
  ) LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', rec.table_schema, rec.table_name);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY;', rec.table_schema, rec.table_name);

    -- Drop existing policies to avoid permissive overlap
    FOR policy_row IN (
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = rec.table_schema
        AND tablename = rec.table_name
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', policy_row.policyname, rec.table_schema, rec.table_name);
    END LOOP;

    -- Determine if table tracks creator
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = rec.table_schema
        AND table_name = rec.table_name
        AND column_name = 'created_by_user_id'
    ) INTO has_created_by;

    update_guard := CASE
      WHEN has_created_by THEN '(created_by_user_id = auth.jwt() ->> ''user_id'' OR organization_id = auth.jwt() ->> ''org_id'')'
      ELSE 'organization_id = auth.jwt() ->> ''org_id'''
    END;

    -- Select
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR SELECT USING (organization_id = auth.jwt() ->> ''org_id'');',
      rec.table_name || '_org_select', rec.table_schema, rec.table_name
    );

    -- Insert
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR INSERT WITH CHECK (organization_id = auth.jwt() ->> ''org_id'');',
      rec.table_name || '_org_insert', rec.table_schema, rec.table_name
    );

    -- Update
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR UPDATE USING (%s) WITH CHECK (organization_id = auth.jwt() ->> ''org_id'');',
      rec.table_name || '_org_update', rec.table_schema, rec.table_name, update_guard
    );

    -- Delete
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR DELETE USING (%s);',
      rec.table_name || '_org_delete', rec.table_schema, rec.table_name, update_guard
    );
  END LOOP;
END $$;

-- Audit-focused tables using org_id naming
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS audit_logs_org_select ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_org_insert ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_org_update ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_org_delete ON public.audit_logs;

    CREATE POLICY audit_logs_org_select ON public.audit_logs
      FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
    CREATE POLICY audit_logs_org_insert ON public.audit_logs
      FOR INSERT WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
    CREATE POLICY audit_logs_org_update ON public.audit_logs
      FOR UPDATE USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
      WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
    CREATE POLICY audit_logs_org_delete ON public.audit_logs
      FOR DELETE USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  END IF;

  IF to_regclass('public.security_events') IS NOT NULL THEN
    ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS security_events_org_select ON public.security_events;
    DROP POLICY IF EXISTS security_events_org_insert ON public.security_events;
    DROP POLICY IF EXISTS security_events_org_update ON public.security_events;
    DROP POLICY IF EXISTS security_events_org_delete ON public.security_events;

    CREATE POLICY security_events_org_select ON public.security_events
      FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
    CREATE POLICY security_events_org_insert ON public.security_events
      FOR INSERT WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
    CREATE POLICY security_events_org_update ON public.security_events
      FOR UPDATE USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
      WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
    CREATE POLICY security_events_org_delete ON public.security_events
      FOR DELETE USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  END IF;
END $$;

-- Work order photo hygiene: backfill org IDs and enforce tenant checks
UPDATE public.work_order_photos wop
SET organization_id = wo.organization_id
FROM public.work_orders wo
WHERE wop.work_order_id = wo.id
  AND wop.organization_id IS NULL;

ALTER TABLE public.work_order_photos
  ALTER COLUMN organization_id SET NOT NULL;

-- Replace permissive photo policies with org-scoped access
DROP POLICY IF EXISTS "Users can view work order photos" ON public.work_order_photos;
DROP POLICY IF EXISTS "Users can insert work order photos" ON public.work_order_photos;
DROP POLICY IF EXISTS "Users can update work order photos" ON public.work_order_photos;
DROP POLICY IF EXISTS "Users can delete work order photos" ON public.work_order_photos;

CREATE POLICY work_order_photos_org_select ON public.work_order_photos
  FOR SELECT USING (organization_id = auth.jwt() ->> 'org_id');

CREATE POLICY work_order_photos_org_insert ON public.work_order_photos
  FOR INSERT WITH CHECK (organization_id = auth.jwt() ->> 'org_id');

CREATE POLICY work_order_photos_org_update ON public.work_order_photos
  FOR UPDATE USING (organization_id = auth.jwt() ->> 'org_id')
  WITH CHECK (organization_id = auth.jwt() ->> 'org_id');

CREATE POLICY work_order_photos_org_delete ON public.work_order_photos
  FOR DELETE USING (organization_id = auth.jwt() ->> 'org_id');

-- Storage bucket protection for work-order-photos using work order org ownership
DROP POLICY IF EXISTS "Authenticated users can upload work order photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view work order photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own work order photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete work order photos" ON storage.objects;

CREATE POLICY work_order_photos_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'work-order-photos'
    AND EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id::text = split_part(name, '/', 2)
        AND wo.organization_id = auth.jwt() ->> 'org_id'
    )
  );

CREATE POLICY work_order_photos_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'work-order-photos'
    AND EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id::text = split_part(name, '/', 2)
        AND wo.organization_id = auth.jwt() ->> 'org_id'
    )
  );

CREATE POLICY work_order_photos_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'work-order-photos'
    AND EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id::text = split_part(name, '/', 2)
        AND wo.organization_id = auth.jwt() ->> 'org_id'
    )
  )
  WITH CHECK (
    bucket_id = 'work-order-photos'
    AND EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id::text = split_part(name, '/', 2)
        AND wo.organization_id = auth.jwt() ->> 'org_id'
    )
  );

CREATE POLICY work_order_photos_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'work-order-photos'
    AND EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id::text = split_part(name, '/', 2)
        AND wo.organization_id = auth.jwt() ->> 'org_id'
    )
  );
