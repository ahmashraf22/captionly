-- Migration: add `google_bio` column to `businesses`
-- Stores a single AI-generated Google Business Profile description (max 750 chars).
-- Run once in the Supabase SQL editor.

alter table businesses
  add column if not exists google_bio text;
