-- 1) Auto-return equipment assignments when a job is completed
CREATE OR REPLACE FUNCTION public.update_assignments_on_job_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Mark related equipment assignments as returned and set a sensible return_date
    UPDATE public.equipment_assignments ea
    SET 
      status = 'returned',
      return_date = COALESCE(ea.return_date, GREATEST(NEW.scheduled_date, CURRENT_DATE)),
      updated_at = now()
    WHERE ea.job_id = NEW.id
      AND ea.status IN ('assigned','delivered','in_service');
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_update_assignments_on_job_completion'
  ) THEN
    CREATE TRIGGER tr_update_assignments_on_job_completion
    AFTER UPDATE OF status ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_assignments_on_job_completion();
  END IF;
END $$;

-- 2) Backfill: clean up any assignments tied to jobs already completed (fixes PKP-011 case)
UPDATE public.equipment_assignments ea
SET 
  status = 'returned',
  return_date = COALESCE(ea.return_date, GREATEST(j.scheduled_date, CURRENT_DATE)),
  updated_at = now()
FROM public.jobs j
WHERE ea.job_id = j.id
  AND j.status = 'completed'
  AND ea.status IN ('assigned','delivered','in_service');

-- 3) Ensure availability calendar stays in sync (create triggers if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_av_cal_ea_ins') THEN
    CREATE TRIGGER tr_av_cal_ea_ins
    AFTER INSERT ON public.equipment_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_availability_calendar();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_av_cal_ea_upd') THEN
    CREATE TRIGGER tr_av_cal_ea_upd
    AFTER UPDATE ON public.equipment_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_availability_calendar();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_av_cal_ea_del') THEN
    CREATE TRIGGER tr_av_cal_ea_del
    AFTER DELETE ON public.equipment_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_availability_calendar();
  END IF;
END $$;

-- 4) Replace/implement enhanced availability RPC without referencing non-existent columns
CREATE OR REPLACE FUNCTION public.get_product_availability_enhanced(
  product_type_id uuid,
  start_date date,
  end_date date,
  filter_attributes jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_stock integer := 0;
  tracked_total integer := 0;
  bulk_pool integer := 0;
  d date;
  daily jsonb := '[]'::jsonb;
  min_avail integer := NULL;
  max_avail integer := NULL;
  sum_avail integer := 0;
  days_count integer := 0;
  available_overall integer := 0;
  items jsonb := '[]'::jsonb;
  tmp_start date;
  tmp_end date;
BEGIN
  -- Normalize dates
  tmp_start := start_date;
  tmp_end := COALESCE(end_date, start_date);
  IF tmp_end < tmp_start THEN
    d := tmp_start; tmp_start := tmp_end; tmp_end := d;
  END IF;

  SELECT COALESCE(p.stock_total,0) INTO total_stock
  FROM public.products p WHERE p.id = product_type_id;

  SELECT COUNT(*) INTO tracked_total
  FROM public.product_items pi
  WHERE pi.product_id = product_type_id;

  bulk_pool := GREATEST(total_stock - tracked_total, 0);

  FOR d IN SELECT gs::date FROM generate_series(tmp_start, tmp_end, interval '1 day') AS gs LOOP
    DECLARE
      tracked_assigned integer := 0;
      bulk_assigned integer := 0;
      tracked_available integer := 0;
      bulk_available integer := 0;
      total_available_day integer := 0;
      conflict_rows jsonb := '[]'::jsonb;
    BEGIN
      -- Count active tracked assignments overlapping day d
      SELECT COALESCE(COUNT(DISTINCT ea.product_item_id),0) INTO tracked_assigned
      FROM public.equipment_assignments ea
      JOIN public.product_items pi ON pi.id = ea.product_item_id
      WHERE pi.product_id = product_type_id
        AND ea.status IN ('assigned','delivered','in_service')
        AND ea.assigned_date <= d
        AND (ea.return_date IS NULL OR ea.return_date >= d);

      -- Sum bulk reservations overlapping day d
      SELECT COALESCE(SUM(ea.quantity),0) INTO bulk_assigned
      FROM public.equipment_assignments ea
      WHERE ea.product_id = product_type_id
        AND ea.product_item_id IS NULL
        AND ea.status IN ('assigned','delivered','in_service')
        AND ea.assigned_date <= d
        AND (ea.return_date IS NULL OR ea.return_date >= d);

      tracked_available := GREATEST(tracked_total - tracked_assigned, 0);
      bulk_available := GREATEST(bulk_pool - bulk_assigned, 0);
      total_available_day := tracked_available + bulk_available;

      conflict_rows := COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'assignment_id', ea.id::text,
            'status', ea.status
          )
        )
        FROM (
          SELECT id, status FROM public.equipment_assignments
          WHERE product_id = product_type_id
            AND product_item_id IS NULL
            AND status IN ('assigned','delivered','in_service')
            AND assigned_date <= d
            AND (return_date IS NULL OR return_date >= d)
          UNION ALL
          SELECT ea.id, ea.status
          FROM public.equipment_assignments ea
          JOIN public.product_items pi ON pi.id = ea.product_item_id
          WHERE pi.product_id = product_type_id
            AND ea.status IN ('assigned','delivered','in_service')
            AND ea.assigned_date <= d
            AND (ea.return_date IS NULL OR ea.return_date >= d)
        ) ea
      ), '[]'::jsonb);

      daily := daily || jsonb_build_object(
        'date', d::text,
        'bulk_available', bulk_available,
        'bulk_assigned', COALESCE(bulk_assigned,0),
        'tracked_available', tracked_available,
        'tracked_assigned', COALESCE(tracked_assigned,0),
        'total_available', total_available_day,
        'conflicts', conflict_rows
      );

      IF min_avail IS NULL OR total_available_day < min_avail THEN
        min_avail := total_available_day;
      END IF;
      IF max_avail IS NULL OR total_available_day > max_avail THEN
        max_avail := total_available_day;
      END IF;
      sum_avail := sum_avail + total_available_day;
      days_count := days_count + 1;
    END;
  END LOOP;

  available_overall := COALESCE(min_avail, total_stock);

  -- Individual items available for the entire range
  items := COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'item_id', pi.id::text,
        'item_code', pi.item_code,
        'status', pi.status
      )
    )
    FROM public.product_items pi
    WHERE pi.product_id = product_type_id
      AND NOT EXISTS (
        SELECT 1 FROM public.equipment_assignments ea
        WHERE ea.product_item_id = pi.id
          AND ea.status IN ('assigned','delivered','in_service')
          AND ea.assigned_date <= tmp_end
          AND (ea.return_date IS NULL OR ea.return_date >= tmp_start)
      )
  ), '[]'::jsonb);

  RETURN jsonb_build_object(
    'available', available_overall,
    'total', total_stock,
    'method', 'enhanced_calendar',
    'individual_items', items,
    'daily_breakdown', daily,
    'summary', jsonb_build_object(
      'min_available', COALESCE(min_avail, 0),
      'max_available', COALESCE(max_avail, 0),
      'avg_available', CASE WHEN days_count > 0 THEN ROUND((sum_avail::numeric / days_count)::numeric, 2) ELSE 0 END,
      'bulk_pool', bulk_pool,
      'tracked_units', tracked_total
    )
  );
END;
$$;