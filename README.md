# Open Tenders

Open-source tender tracking and management for bid teams.

Open Tenders brings opportunities, deadlines, owners and risks into one shared workspace for UK SMEs bidding on public- and private-sector contracts.

**[View the live demo](https://open-tenders.vercel.app)**

## The problem

Small bid teams often coordinate high-value submissions through spreadsheets, calendars, inboxes and individual memory. That makes it difficult to see ownership, deadlines, dependencies and learning from previous outcomes.

Open Tenders was designed around the decisions a bid team needs to make: whether to pursue an opportunity, who owns the next action, what is at risk and what the team has learned.

## Product capabilities

- **Tender dashboard:** open deadlines, ownership and risk at a glance
- **Kanban workflow:** identify → prepare → submit → won/lost
- **Calendar:** shared deadline and milestone planning
- **Insights:** pipeline value, win/loss history and team activity
- **Multi-user organisations:** invitations, owners and permission levels
- **Sites and staffing map:** operational context for qualification and mobilisation
- **Telegram reminders:** optional daily deadline notifications

## Product history

Open Tenders is the open-source edition of **TenderFlow**, an original commercial product designed and built by Matthew Timms.

TenderFlow began as an attempt to commercialise a recurring problem observed in bid teams: fragmented qualification, ownership and deadline management. After reviewing a crowded market and concluding that the proposition needed stronger differentiation, Matthew stopped pursuing monetisation and converted the product into this open-source edition.

The pivot is part of the case study. A genuine user problem does not automatically create a defensible commercial product, and stopping or repositioning can be the responsible product decision.

Read the full product case study in `docs/product-case-study.md`.

## Technology

- Next.js App Router, React and TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Postgres, Auth and Edge Functions
- Leaflet and OpenStreetMap
- Postcodes.io geocoding

## Local development

```bash
git clone https://github.com/matteux-star/open-tenders.git
cd open-tenders
npm install
cp .env.example .env.local
npx supabase start
npm run dev
```

See `supabase/README.md` for database setup, Edge Function secrets and seeded demo users.

## Current status

This is a portfolio and open-source project rather than an actively commercialised service. Before production use, review the authentication, data-protection, email and reminder configuration for your organisation.

## Feedback

If you work in bids or proposals, useful feedback includes:

- which information you still need outside the product;
- where qualification or ownership remains unclear;
- whether the workflow matches the stages your team actually uses; and
- whether operational mapping would change a bid/no-bid discussion.

Please use GitHub Issues for reproducible product or technical feedback.

## Licence

The repository currently contains an MIT licence reference in its project history, but no `LICENSE` file was present in the audited working copy. Add the intended licence file before describing the repository as formally MIT-licensed.
