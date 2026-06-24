# Gym Busyness (Phase 1)

Google-style **Popular Times** chart on gym profile pages. Data is seeded offline via the local MatCapacityChart worker CLI — not hosted in this repo.

## Database

Apply migration:

```bash
supabase db push
# or run supabase/migrations/20260624120000_gym_busyness.sql in the SQL editor
```

## UI

- `components/gym/gym-busyness-meter.tsx` — chart or fallback banner
- Rendered on `app/gyms/[id]/page.tsx` in the sidebar **Mat Capacity** card

## Seeding data (local CLI)

Use the local `MatCapacityChart/worker` folder pointed at the CombatStay Supabase project:

```bash
npm run worker -- --gym-id <gym-uuid> [--place-id ChIJ...]
```

Gyms with `google_maps_link` containing `place_id=` do not need `--place-id`.

## Phase 1.5 (future)

Map `popular_times` baseline percentages onto `gyms.training_schedule` slots and add live booking overlays.
