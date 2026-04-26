-- Add things_to_do JSONB column to gyms table.
-- Populated once per gym via the admin enrichment endpoint using
-- OpenStreetMap Overpass API data (free, no API key required).
-- The gym page reads this at render time — no per-request API calls.

alter table gyms
  add column if not exists things_to_do jsonb;

comment on column gyms.things_to_do is
  'Pre-fetched nearby POIs from OpenStreetMap (restaurants, parks, beaches, training venues, markets). '
  'Each item: { name: string, category: "eat"|"nature"|"training"|"explore", distanceKm: number }. '
  'Populated via /api/admin/gyms/enrich-things-to-do.';
