-- Atomic function: update a single finding's state and recalculate
-- scan_modules.status and scans.status in one DB round trip.
-- Run this in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION update_finding_state(
  p_scan_id   uuid,
  p_module    text,
  p_finding_id text,
  p_state     text   -- 'done' | 'dismissed' | NULL to undo
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_findings       jsonb;
  v_findings_state jsonb;
  v_next_state     jsonb;
  v_has_open       boolean;
  v_module_status  text;
  v_scan_status    text;
BEGIN
  -- Lock the row so concurrent taps can't interleave
  SELECT findings, COALESCE(findings_state, '{}'::jsonb)
  INTO   v_findings, v_findings_state
  FROM   scan_modules
  WHERE  scan_id = p_scan_id AND module = p_module
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Module not found: % / %', p_scan_id, p_module;
  END IF;

  -- Apply the state change
  IF p_state IS NULL THEN
    v_next_state := v_findings_state - p_finding_id;
  ELSE
    v_next_state := v_findings_state || jsonb_build_object(p_finding_id, p_state);
  END IF;

  -- Any critical/warning findings still open?
  SELECT EXISTS (
    SELECT 1
    FROM   jsonb_array_elements(COALESCE(v_findings, '[]'::jsonb)) AS f
    WHERE  f->>'type' IN ('critical', 'warning')
    AND   (
            v_next_state->>(f->>'id') IS NULL
            OR v_next_state->>(f->>'id') NOT IN ('done', 'dismissed')
          )
  ) INTO v_has_open;

  v_module_status := CASE WHEN v_has_open THEN 'fail' ELSE 'pass' END;

  -- Write module in one shot
  UPDATE scan_modules
  SET    findings_state = v_next_state,
         status         = v_module_status
  WHERE  scan_id = p_scan_id AND module = p_module;

  -- Derive scan-level status without a second SELECT
  SELECT CASE
    WHEN bool_or(
           CASE WHEN m.module = p_module THEN v_module_status = 'fail'
                ELSE m.status = 'fail' END)
    THEN 'fail'
    WHEN bool_and(
           CASE WHEN m.module = p_module
                THEN v_module_status IN ('pass','not_applicable')
                ELSE m.status        IN ('pass','not_applicable') END)
    THEN 'pass'
    ELSE 'uncertain'
  END
  INTO   v_scan_status
  FROM   scan_modules m
  WHERE  m.scan_id = p_scan_id;

  UPDATE scans SET status = v_scan_status WHERE id = p_scan_id;

  RETURN jsonb_build_object(
    'findings_state', v_next_state,
    'module_status',  v_module_status,
    'scan_status',    v_scan_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_finding_state(uuid, text, text, text)
  TO service_role, authenticated;
