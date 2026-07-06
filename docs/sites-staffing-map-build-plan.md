# Sites & Staffing Map: Build Plan

## Goal

Add a page to OpenTenders that shows every site a business services on a map, with the standard number of engineers at each site. A bid writer opens the page, looks at a new contract's location, and sees the standard headcount at nearby sites to judge whether pricing a new contract there is realistic.

## Non-goals

- No live GPS or engineer tracking.
- No rota or shift scheduling. This stores a standard headcount, not a live roster.
- No route planning or drive-time optimisation in v1.

## Data model

Two tables, not one bloated one:

```sql
sites
 id, business_id, name, address, postcode, lat, lng, notes, created_at

site_staffing
 id, site_id, role, standard_headcount, updated_at
```

`postcode` is required. `address` is free text for display only and never sent to the geocoder. Postcodes.io geocodes UK postcodes, not full street addresses, so the postcode field is what drives the map pin.

Splitting `site_staffing` out lets a site hold several roles (engineers, technicians) without adding columns later. If you only ever track one number per site, collapse this into a single `standard_headcount` column on `sites` instead. Don't build the split version until you know you need more than one role.

If OpenTenders hosts more than one business per instance, every query against these tables must filter by `business_id`, taken from the logged-in session, never from a request parameter.

## Components

1. **Geocoding.** On site creation, turn the postcode into lat/lng. Use Postcodes.io: free, UK-only, no API key.
2. **Map page.** Plot every site for the logged-in business as a marker. Use Leaflet with OpenStreetMap tiles.
3. **Site panel.** Clicking a marker opens a side panel showing the site name, address, and standard headcount per role.
4. **Bulk import.** CSV upload for onboarding a business with many existing sites.
5. **Manual coordinate override.** Fallback field for when geocoding fails or is wrong.

## Data flow

User adds/edits a site → app geocodes postcode via Postcodes.io → lat/lng stored → map page queries all sites for the business → Leaflet renders markers → click opens panel reading `site_staffing`.

## Key decisions

- **Postcodes.io over Google Maps Geocoding** — free, UK-only, no key management.
- **Leaflet over Mapbox** — no API key, no cost, markers + popup only.
- **Split staffing table over single column** — only if multiple roles per site are a real near-term need.
- **No radius-based "available engineers near this contract" calculator in v1** — natural next step, ship the map first.
- **Tenant isolation at the query layer** — every site/staffing lookup takes `business_id` from session, never request params.

## Risks and failure modes

- **Geocoding fails on a bad postcode** — show unplaced on map, flag in list, let user drop pin manually.
- **Marker clutter at scale** — use Leaflet.markercluster from the start.
- **Stale headcount** — show "last updated" date, flag entries older than 90 days.
- **Partial failure on bulk import** — import good rows, skip bad, return skip list with reasons.

## Open questions

- Single role ("engineers") or several role types per site?
- Filter map by region / contract type, or all sites at once for v1?

## Build phases

1. **Schema and API** — add `sites` and `site_staffing` tables (or single-table version) plus CRUD endpoints.
2. **Geocoding on save** — wire up Postcodes.io in site create/edit flow, manual override field.
3. **Map page** — Leaflet map, markers from sites endpoint, clustering enabled.
4. **Site panel** — click-to-open panel showing staffing data.
5. **CSV import** — bulk site upload for onboarding.
6. **Stale-data flag** — "last updated" indicator once core page works.

Build and test each phase before starting the next.
