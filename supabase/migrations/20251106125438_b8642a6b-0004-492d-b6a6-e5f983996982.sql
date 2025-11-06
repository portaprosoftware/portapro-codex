-- Migration Part 1: Add new enum values with org: prefix
-- PostgreSQL requires enum values to be committed before use

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'org:owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'org:admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'org:dispatcher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'org:driver';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'org:viewer';