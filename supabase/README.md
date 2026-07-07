# OpenTenders Supabase Scaffold

This folder contains the backend scaffold for OpenTenders.

## Local setup

1. Install project dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Start or reset Supabase locally:

   ```bash
   supabase start
   supabase db reset
   ```

The seed creates a demo organisation, three users, sample tenders, deadlines, activity, and renewal-watch contracts.

## Production Edge Function secrets

Set these Supabase Edge Function secrets before deploying:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=
RESEND_API_KEY=
RESEND_FROM=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
CRON_SECRET=
```

Deploy the functions:

```bash
supabase functions deploy invite-member
supabase functions deploy accept-invite
supabase functions deploy send-deadline-reminders
supabase functions deploy create-telegram-link
supabase functions deploy telegram-webhook
```

Schedule `send-deadline-reminders` with Supabase Cron once per day. Use `verify_jwt = false` for that function and send the `CRON_SECRET` value as either the `x-cron-secret` header or a bearer token.

## Demo users

All seeded users use the password `password123`.

- `maya@example.com` - admin
- `james@example.com` - editor
- `sam@example.com` - viewer
