-- Migration: site_surveys_notes_column (20260815090000)
--
-- The site survey scheduling dialog captures a pre-visit notes field (what to check,
-- special access instructions, etc.) distinct from `findings` (post-visit results) —
-- the original crm_depth_schema migration omitted this column.

alter table public.site_surveys add column notes text;
