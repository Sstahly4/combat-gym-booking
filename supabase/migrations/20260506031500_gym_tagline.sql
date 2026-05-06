-- Owner-written one-liner shown under gym name on mobile search (max 80 chars in DB).
-- Displayed at ~60 chars before truncation on handsets.
alter table public.gyms
  add column if not exists tagline varchar(80) default null;

comment on column public.gyms.tagline is
  'Short listing hook shown on mobile search cards under the gym name. Max 80 chars. E.g. "Beachside Muay Thai in the heart of Krabi".';
