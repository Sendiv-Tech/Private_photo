-- =========================================================
-- PRIVATE VAULT — Supabase setup
-- Run this once in: Supabase Dashboard → SQL Editor → New query
--
-- Coming from MySQL? Two things will look unfamiliar:
--   1. Postgres uses `uuid` + `gen_random_uuid()` where MySQL
--      might use AUTO_INCREMENT ints or a UUID() call.
--   2. Row Level Security (RLS) has no MySQL equivalent — MySQL
--      permissions are GRANT-based per user/role on a whole
--      table. RLS instead writes a rule directly on the table
--      ("policy") that runs on every single row for every
--      request, e.g. "only allow INSERT if bucket_id = X".
--      Until you add Auth, the policies below say "anyone with
--      the anon key can do this" — that's intentionally open
--      for now since auth wasn't in scope yet.
-- =========================================================


-- ---------------------------------------------------------
-- 1. Storage bucket for the actual image files
-- ---------------------------------------------------------
-- You can also create this by clicking Storage → New bucket
-- in the dashboard instead — either way works, this just
-- lets you keep the whole setup in one script.

insert into storage.buckets (id, name, public)
values ('vault-photos', 'vault-photos', false)
on conflict (id) do nothing;

-- Allow uploads into this bucket (anon = your public API key,
-- i.e. anyone using your frontend right now, since there's no
-- login gating this yet)
create policy "vault-photos: anon can upload"
on storage.objects for insert
to anon
with check ( bucket_id = 'vault-photos' );

-- Allow reading files back out (needed to view/download them)
create policy "vault-photos: anon can read"
on storage.objects for select
to anon
using ( bucket_id = 'vault-photos' );


-- ---------------------------------------------------------
-- 2. Metadata table — one row per uploaded photo
-- ---------------------------------------------------------
-- The file itself lives in Storage (above); this table just
-- keeps a searchable record of what was uploaded, so the
-- dashboard can eventually list/query photos instead of only
-- having raw files in a bucket.

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,        -- path inside the vault-photos bucket
  file_name text not null,        -- original filename from the user's device
  file_size integer,              -- bytes
  content_type text,              -- e.g. image/jpeg
  uploaded_at timestamptz default now()
);

alter table photos enable row level security;

create policy "photos: anon can insert"
on photos for insert
to anon
with check (true);

create policy "photos: anon can read"
on photos for select
to anon
using (true);
