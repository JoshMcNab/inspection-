# Ultimate Automotive Works Workshop App

Production workshop web app for vehicle inspections, jobs, quotes, customer approvals, invoices, loyalty, customer notifications, repair data, parts cataloguing and Workshop Pro tools.

## Live app

- Workshop: `https://app.ultimateautomotiveworks.com`
- Workshop Pro: `https://app.ultimateautomotiveworks.com/operations.html`

## Architecture

The browser app is hosted with GitHub Pages and uses authenticated Supabase Edge Functions for protected workshop data. The v25 core lives under `src/core/` and centralises configuration, API routing, staff authentication and feature loading.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) before adding or restructuring features.

## Quality checks

Run locally with Node.js:

```bash
node scripts/quality-check.mjs
```

The same checks run automatically in GitHub Actions on pushes and pull requests.

## Security

Do not commit service-role keys, PayPal secrets, passwords or other private credentials. Browser code may only contain values intended to be public.
