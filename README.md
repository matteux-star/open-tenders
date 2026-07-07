# OpenTenders

Open-source tender tracking and management for bid teams.

Replace spreadsheet-led tender tracking with one workspace for bids, deadlines, owners, and risk. Built for UK SMEs that bid on public and private sector contracts.

## Features

- **Tender dashboard** — see all open deadlines, owned bids, and flagged risks at a glance
- **Kanban board** — drag bids through stages (identify → prepare → submit → won/lost)
- **Calendar view** — visual deadline management across the team
- **Insights** — win/loss tracking, pipeline value, and team performance
- **Multi-user orgs** — invite colleagues, assign owners, share a tender workspace
- **Sites & Staffing Map** — plot service locations and standard headcounts to inform bid pricing
- **Telegram reminders** — daily deadline push notifications (optional)

## Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Auth:** Supabase Auth (magic link, OAuth)
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Geocoding:** Postcodes.io (UK postcodes, free)

## Getting Started

```bash
# Clone
git clone https://github.com/your-org/open-tenders
cd open-tenders

# Install
npm install

# Copy env template
cp .env.example .env.local
# Edit .env.local with your Supabase project details

# Run migrations
npx supabase start

# Dev server
npm run dev
```

## Deployment

OpenTenders is designed to be self-hosted. Deploy via:

- **Cloudflare Pages** — `npm run pages:build` then deploy with Wrangler
- **Docker** — `docker compose up -d` (see `Dockerfile`)
- **Vercel** — connect your Supabase project and deploy

## Origin

OpenTenders is an open-source fork of [TenderFlow](https://tenderflow.com), stripped of billing, marketing, and rebranded as a community portfolio project. All core functionality — multi-user orgs, tender CRUD, kanban, calendar, insights, reminders — is preserved.

## License

MIT
