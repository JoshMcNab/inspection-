# Ultimate Automotive Works — Workshop App Architecture

## Purpose

The workshop app is intentionally kept deployable as a static GitHub Pages site with a Supabase backend. The v25 cleanup introduces a stable core without rewriting working workshop features or customer data.

## Active structure

```text
src/
  core/
    config-v25.js      # one source of truth for versions, endpoints and service names
    api-v25.js         # API routing, auth headers and bootstrap offline fallback
    auth-v25.js        # staff sign-in/session behaviour
    features-v25.js    # controlled feature registry and loading order
styles/
  theme-v25.css        # design tokens / shared visual constants
scripts/
  quality-check.mjs    # repository checks used by CI
```

Existing feature files such as `repair-data-v23.js` and `parts-catalog-v24.js` remain supported while they are progressively migrated into feature folders. `pin.js` is now a small compatibility bootstrap rather than the place where application services and feature patches are maintained.

## Rules for future development

1. **One API path** — new browser features should call `WorkshopAPI.request(service, action, payload)` instead of hard-coding Supabase URLs.
2. **One configuration source** — endpoint names, storage keys and release versioning belong in `src/core/config-v25.js`.
3. **One feature registry** — new additive modules are registered in `src/core/features-v25.js`; do not add ad-hoc script injection to authentication code.
4. **Design tokens first** — new UI should use variables from `styles/theme-v25.css` instead of repeating colours/radii/spacing.
5. **Backward-compatible data changes** — production database migrations must preserve existing customer, vehicle, job, quote, invoice, loyalty, repair and parts records.
6. **No secrets in GitHub** — browser code may contain public project identifiers/publishable values only. Service-role and merchant secrets stay in Supabase secrets.
7. **Offline schema awareness** — changes that alter offline payload structure should include a migration/version strategy before release.
8. **Quality checks before release** — GitHub Actions must pass syntax, asset-reference and obvious-secret checks.
9. **Small releases** — prefer one contained feature/refactor per release over large rewrites of working production behaviour.
10. **Preserve the master logo** — `logo.png` is a protected brand asset. Derived presentation artwork should use separate filenames.

## Release strategy

- `25.x` is the compatibility/refactor generation.
- Existing `v16`–`v24` filenames are legacy feature generation labels, not independent applications.
- New architecture work should avoid creating more root-level `*-vNN.js` files where a proper module can be used.
- A future TEST environment should be introduced before major database or workflow changes are made directly against production.

## Backend boundary

The browser never receives database service-role access. Requests pass through the Workshop Gateway to authenticated Supabase Edge Functions. Protected tables keep Row Level Security enabled and are accessed by trusted server-side functions.

## Refactor principle

The production system is being cleaned incrementally. Working features should be wrapped or migrated first, verified, and only then should obsolete compatibility files be removed. This avoids a risky all-at-once rewrite of a live workshop system.
